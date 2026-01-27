<?php
/**
 * Plugin Name: Wezet Identity Bridge (Unified)
 * Description: Bi-directional Sync & SSO. Syncs new customers to Supabase AND allows login via Wezet Booking App.
 * Version: 2.0
 * Author: Wezet
 */

if (!defined('ABSPATH')) {
    exit;
}

// CONFIGURATION
// Replace with your actual URL and Service Role Key from Supabase Dashboard > Settings > API
define('WEZET_SUPABASE_FUNCTION_URL', 'https://aadzzhdouuxkvelxyoyf.supabase.co/functions/v1/sync-user');
define('WEZET_SUPABASE_URL', 'https://aadzzhdouuxkvelxyoyf.supabase.co');
// ⚠️ SAFETY WARNING: Should be defined in wp-config.php ideally
define('WEZET_SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHp6aGRvdXV4a3ZlbHh5b3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcxNzM2OSwiZXhwIjoyMDc5MjkzMzY5fQ.AUVvOxgVg2zxO4M97CPLG9lyvcqUYda5alB3KiNFPFI');

class Wezet_Identity_Bridge
{

    public function __construct()
    {
        // --- OUTBOUND LIGIC (WP -> Supabase) ---
        // Hook into WooCommerce Customer creation
        add_action('woocommerce_created_customer', array($this, 'sync_woocommerce_customer'), 10, 3);
        // Hook into standard WP User registration
        add_action('user_register', array($this, 'sync_wp_user'), 10, 1);

        // Sync on Login (Legacy Migration)
        add_action('wp_login', array($this, 'sync_wp_user_on_login'), 10, 2);

        // --- INBOUND LOGIC (Supabase -> WP) ---
        // Intercept requests to check for SSO token
        add_action('init', array($this, 'handle_sso_callback'));

        // --- REDIRECTIONS (Centralization) ---
        // Redirect WooCommerce "My Account" to Booking Dashboard
        add_action('template_redirect', array($this, 'redirect_my_account'));

        // Redirect Login/Register pages to Booking SSO
        add_action('template_redirect', array($this, 'redirect_login_pages'));

        // FORCE CENTRAL LOGIN: Redirect wp-login.php also
        add_action('login_init', array($this, 'redirect_wp_login'));

        // Optional: Shortcode for Login Button
        add_shortcode('wezet_login_button', array($this, 'render_login_button'));
    }

    /**
     * Handle WooCommerce Customer Creation
     */
    public function sync_woocommerce_customer($customer_id, $new_customer_data, $password_generated)
    {
        $this->sync_user_to_supabase($customer_id, 'woocommerce');
    }

    /**
     * Handle Standard WP User Registration
     */
    public function sync_wp_user($user_id)
    {
        $this->sync_user_to_supabase($user_id, 'wp_register');
    }

    /**
     * Sync on WP Login
     */
    public function sync_wp_user_on_login($user_login, $user)
    {
        $this->sync_user_to_supabase($user->ID, 'shop_login');
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
            'role' => in_array('administrator', $user_info->roles) ? 'Admin' : 'Client',
            'source' => $source,
            'wp_user_id' => $user_id
        );

        // Send to Supabase Edge Function
        $response = wp_remote_post(WEZET_SUPABASE_FUNCTION_URL, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . WEZET_SUPABASE_SERVICE_KEY
            ),
            'body' => json_encode($payload),
            'blocking' => false, // Async, don't slow down WP checkout
            'timeout' => 15
        ));

        if (is_wp_error($response)) {
            error_log('[Wezet Bridge] Error syncing user: ' . $response->get_error_message());
        }
    }

    /**
     * Handle SSO Callback (Inbound)
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

        $email = $user_data->email;

        // 2. Find or Create WP User
        $user = get_user_by('email', $email);

        if (!$user) {
            // Auto-create user if they don't exist
            $username = $email;
            $random_password = wp_generate_password(12, false);
            $user_id = wp_create_user($username, $random_password, $email);

            if (is_wp_error($user_id)) {
                wp_die('Could not create user: ' . $user_id->get_error_message());
            }

            // Sync metadata
            $user = get_user_by('id', $user_id);
            if (isset($user_data->user_metadata->full_name)) {
                $name_parts = explode(' ', $user_data->user_metadata->full_name, 2);
                wp_update_user(array(
                    'ID' => $user_id,
                    'first_name' => $name_parts[0],
                    'last_name' => isset($name_parts[1]) ? $name_parts[1] : ''
                ));
            }
            // IMPORTANT: Assign Customer Role for WooCommerce
            $user->add_role('customer');
        }

        // 3. Log the user in
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID);

        // 4. Redirect to Home (or where they came from)
        // Since Shop is just landings, Home is safest.
        wp_redirect(home_url());
        exit;
    }

    /**
     * Call Supabase Auth API
     */
    private function validate_token($token)
    {
        $url = WEZET_SUPABASE_URL . '/auth/v1/user';

        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $token,
                'apikey' => WEZET_SUPABASE_SERVICE_KEY
            ),
            'timeout' => 15
        ));

        if (is_wp_error($response)) {
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        return json_decode($body);
    }

    /**
     * Redirect My Account to Booking Dashboard
     */
    public function redirect_my_account()
    {
        // 1. WooCommerce Support (Safe check)
        if (function_exists('is_account_page') && is_account_page() && is_user_logged_in()) {
            wp_redirect('https://booking.wezet.xyz/?view=client-dashboard');
            exit;
        }

        // 2. WP User Manager / Generic Support
        // Check for common slugs used by account plugins (English & Spanish)
        if (is_user_logged_in() && is_page(array('account', 'profile', 'my-account', 'mi-cuenta', 'usuario', 'perfil'))) {
            wp_redirect('https://booking.wezet.xyz/?view=client-dashboard');
            exit;
        }
    }

    /**
     * Redirect Login & Register Pages to SSO
     */
    public function redirect_login_pages()
    {
        // If user is already logged in, do nothing (or let redirect_my_account handle it)
        if (is_user_logged_in())
            return;

        // Check for Login/Register pages
        // Adjust these slugs to match your actual pages in Shop
        $login_slugs = array('login', 'signin', 'iniciar-sesion', 'register', 'signup', 'registro', 'acceder');

        if (is_page($login_slugs)) {
            // Build SSO Link
            $booking_app_url = 'https://booking.wezet.xyz/?view=sso-authorize';
            // Determine where to send them back after login (Home or the page they were trying to visit?)
            // Usually Home is safer to avoid looping back to /login
            $redirect_back = home_url();

            $sso_link = $booking_app_url . '&redirect=' . urlencode($redirect_back);

            wp_redirect($sso_link);
            exit;
        }
    }



    /**
     * Force WP Login PHP to SSO
     */
    public function redirect_wp_login()
    {
        if (isset($_GET['action']) && $_GET['action'] == 'logout')
            return;
        if (isset($_POST['log']))
            return; // Allow normal login attempts (for admin backdoors if needed)

        $booking_app_url = 'https://booking.wezet.xyz/?view=sso-authorize';
        $current_url = home_url();
        wp_redirect($booking_app_url . '&redirect=' . urlencode($current_url));
        exit;
    }

    public function render_login_button()
    {
        if (is_user_logged_in()) {
            return '<a href="https://booking.wezet.xyz/?view=client-dashboard" class="button">Ir a Mi Panel</a>';
        }

        $booking_app_url = 'https://booking.wezet.xyz/?view=sso-authorize';
        $current_url = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        $sso_link = $booking_app_url . '&redirect=' . urlencode($current_url);

        return '<a href="' . esc_url($sso_link) . '" class="wezet-sso-button">Login / Sign Up con Wezet</a>';
    }
}

new Wezet_Identity_Bridge();
