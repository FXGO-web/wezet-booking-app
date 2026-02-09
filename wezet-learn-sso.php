<?php
/**
 * Plugin Name: Wezet Learn SSO Client
 * Description: Allows logging in via Wezet Booking App (Supabase).
 * Version: 1.0
 * Author: Wezet
 */

if (!defined('ABSPATH')) {
    exit;
}

// CONFIGURATION
// Replace with your actual URL and Service Role Key from Supabase Dashboard > Settings > API
define('WEZET_LEARN_SUPABASE_URL', 'https://aadzzhdouuxkvelxyoyf.supabase.co');
define('WEZET_LEARN_SUPABASE_FUNCTION_URL', 'https://aadzzhdouuxkvelxyoyf.supabase.co/functions/v1/sync-user');
define('WEZET_LEARN_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHp6aGRvdXV4a3ZlbHh5b3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcxNzM2OSwiZXhwIjoyMDc5MjkzMzY5fQ.AUVvOxgVg2zxO4M97CPLG9lyvcqUYda5alB3KiNFPFI');

class Wezet_Learn_SSO
{

    public function __construct()
    {
        // 1. INBOUND SSO: Intercept requests to check for SSO token
        add_action('init', array($this, 'handle_sso_callback'));

        // 2. OUTBOUND SYNC: Sync user when they log in to Learn (Legacy Migration)
        add_action('wp_login', array($this, 'sync_wp_user_on_login'), 10, 2);

        // Add "Login with Wezet" shortcode [wezet_login_button]
        add_shortcode('wezet_login_button', array($this, 'render_login_button'));

        // Redirect wp-login.php to SSO (FORCE CENTRAL LOGIN)
        add_action('login_init', array($this, 'redirect_wp_login'));

        // Also check frontend pages (Tutor LMS Dashboard, etc.)
        add_action('template_redirect', array($this, 'redirect_wp_login'));

        // --- INBOUND SYNC (Supabase -> WP) ---
        add_action('rest_api_init', array($this, 'register_sync_route'));
    }

    /**
     * Register REST API Route for Sync
     */
    public function register_sync_route()
    {
        register_rest_route('wezet/v1', '/user', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_incoming_sync'),
            'permission_callback' => '__return_true' // We validate secret manually
        ));
    }

    /**
     * Handle Incoming Sync Payload
     */
    public function handle_incoming_sync($request)
    {
        $secret = $request->get_header('X-Wezet-Sync-Secret');
        // Ideally matches Deno.env.get("WEZET_SYNC_SECRET")
        $expected = defined('WEZET_SYNC_SECRET') ? WEZET_SYNC_SECRET : 'wezet_sync_secret_fallback';

        if ($secret !== $expected) {
            return new WP_Error('forbidden', 'Invalid Secret', array('status' => 403));
        }

        $params = $request->get_json_params();
        $email = sanitize_email($params['email']);

        if (!$email) {
            return new WP_Error('missing_email', 'Email required', array('status' => 400));
        }

        // Find or Create User
        $user = get_user_by('email', $email);
        $user_id = 0;
        $is_new = false;

        if (!$user) {
            $username = $email;
            $password = wp_generate_password(16, false);
            $user_id = wp_create_user($username, $password, $email);
            if (is_wp_error($user_id)) {
                return $user_id;
            }
            $is_new = true;
            $user = get_user_by('id', $user_id);
        } else {
            $user_id = $user->ID;
        }

        // Update Metadata
        if (!empty($params['full_name'])) {
            $name_parts = explode(' ', $params['full_name'], 2);
            wp_update_user(array(
                'ID' => $user_id,
                'first_name' => $name_parts[0],
                'last_name' => isset($name_parts[1]) ? $name_parts[1] : '',
                'display_name' => $params['full_name']
            ));
        }

        // Assing 'student' or 'subscriber' role for Learn
        $user->add_role('subscriber');

        return array(
            'success' => true,
            'user_id' => $user_id,
            'action' => $is_new ? 'created' : 'updated'
        );
    }

    /**
     * Sync WP User to Supabase on Login
     */
    public function sync_wp_user_on_login($user_login, $user)
    {
        $this->sync_user_to_supabase($user->ID, 'learn_login');
    }

    /**
     * Core Sync Logic (Outbound)
     */
    private function sync_user_to_supabase($user_id, $source)
    {
        $user_info = get_userdata($user_id);
        if (!$user_info)
            return;

        // Prepare Payload
        $payload = array(
            'email' => $user_info->user_email,
            'firstName' => $user_info->first_name,
            'lastName' => $user_info->last_name,
            'role' => in_array('administrator', $user_info->roles) ? 'Admin' : 'Student',
            'source' => $source,
            'wp_user_id' => $user_id
        );

        // Send to Supabase Edge Function
        wp_remote_post(WEZET_LEARN_SUPABASE_FUNCTION_URL, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . WEZET_LEARN_SERVICE_KEY
            ),
            'body' => json_encode($payload),
            'blocking' => false, // Async
            'timeout' => 15
        ));
    }

    /**
     * Handle the callback from Booking App
     * ?wezet_sso_token=ACCESS_TOKEN
     */
    public function handle_sso_callback()
    {
        if (!isset($_GET['wezet_sso_token'])) {
            return;
        }

        $access_token = sanitize_text_field($_GET['wezet_sso_token']);

        // 1. Validate Token with Supabase
        $user_data = $this->validate_token($access_token);

        if (!$user_data || isset($user_data->error)) {
            wp_die('SSO Validation Failed: ' . json_encode($user_data));
        }

        $email = $user_data->email; // The email from Supabase Auth

        // 2. Find or Create WP User
        $user = get_user_by('email', $email);

        if (!$user) {
            // Auto-create user if they don't exist in Learn
            // We use the email as username for simplicity
            $username = $email;
            $random_password = wp_generate_password(12, false);
            $user_id = wp_create_user($username, $random_password, $email);

            if (is_wp_error($user_id)) {
                wp_die('Could not create user: ' . $user_id->get_error_message());
            }

            // Set default role (Subscriber/Student)
            $user = get_user_by('id', $user_id);
            // Update name from metadata if available
            if (isset($user_data->user_metadata->full_name)) {
                $name_parts = explode(' ', $user_data->user_metadata->full_name, 2);
                wp_update_user(array(
                    'ID' => $user_id,
                    'first_name' => $name_parts[0],
                    'last_name' => isset($name_parts[1]) ? $name_parts[1] : ''
                ));
            }
        }

        // 3. Log the user in
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID);

        // 4. Redirect to home or intended page (remove token from URL)
        wp_redirect(home_url('/dashboard'));
        exit;
    }

    /**
     * Call Supabase Auth API to get user details from token
     */
    private function validate_token($token)
    {
        $url = WEZET_LEARN_SUPABASE_URL . '/auth/v1/user';

        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $token,
                'apikey' => WEZET_LEARN_SERVICE_KEY // We trust the service key to validate? 
                // Actually, for /user endpoint, we just pass the Bearer token. 
                // But providing APIKey header is usually required by Kong gateway.
                // We use SERVICE KEY here to ensure we bypass RLS if we need to, but for /user simple check is enough.
            ),
            'timeout' => 15
        ));

        if (is_wp_error($response)) {
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        return json_decode($body);
    }

    public function render_login_button()
    {
        if (is_user_logged_in()) {
            return '<a href="/dashboard-cursos" class="button">Ir a mis Cursos</a>';
        }

        // This URL points to your Vercel App's SSO route
        // IMPORTANT: Update this if your production URL is different
        $booking_app_url = 'https://booking.wezet.xyz/?view=sso-authorize';
        $current_url = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']; // or hardcode learn.wezet.xyz

        $sso_link = $booking_app_url . '&redirect=' . urlencode($current_url);

        return '<a href="' . esc_url($sso_link) . '" class="wezet-sso-button" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login con Wezet</a>';
    }

    public function redirect_wp_login()
    {
        if (isset($_GET['action']) && $_GET['action'] == 'logout')
            return;

        // 1. Force Redirect on Standard WP Login (POST or GET)
        // We remove the check for POST['log'] to aggressively force SSO unless it's an AJAX request
        if (defined('DOING_AJAX') && DOING_AJAX)
            return;

        // 2. Check for Tutor LMS / Page Slugs
        $current_uri = $_SERVER['REQUEST_URI'];
        $force_redirect_slugs = array('login', 'signin', 'dashboard', 'student-registration', 'iniciar-sesion', 'registro');

        $should_redirect = false;

        // Check standard login_init (wp-login.php)
        if (strpos($_SERVER['SCRIPT_NAME'], 'wp-login.php') !== false) {
            $should_redirect = true;
        }

        // Check slugs
        foreach ($force_redirect_slugs as $slug) {
            if (strpos($current_uri, $slug) !== false) {
                $should_redirect = true;
                break;
            }
        }

        if ($should_redirect && !is_user_logged_in()) {
            $booking_app_url = 'https://booking.wezet.xyz/?view=sso-authorize';
            $current_url = home_url($current_uri); // Persist deep link
            wp_redirect($booking_app_url . '&redirect=' . urlencode($current_url));
            exit;
        }
    }
}

new Wezet_Learn_SSO();
