import hannaImage from "figma:asset/d73a557d2582e5e01e1f7e3dcf05b59273bca264.png";
import saszelineImage from "figma:asset/fda87a66f2e17d40c399a1e064a39dc4270c29e0.png";
import samiImage from "figma:asset/413e215f985fac150c54cf4764d193bae9e70a9b.png";
import pacoImage from "figma:asset/8bab7df05112aa78f578f627c0ac57d2c1c6d9ef.png";

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  initials: string;
  specialties: string[];
  bio?: string;
  avatarUrl?: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 1,
    name: "Hanna Maria Lynggaard",
    role: "Founder & CEO WEZET",
    initials: "HML",
    specialties: ["Breathwork", "Coaching", "Education", "Leadership"],
    bio: "Founder and visionary behind WEZET's transformational approach to wellness",
    avatarUrl: hannaImage,
  },
  {
    id: 2,
    name: "Saszeline Emmanuellee",
    role: "Teacher & Partner WEZET",
    initials: "SE",
    specialties: ["Breathwork", "Bodywork", "Movement", "Energy"],
    bio: "Partner and teacher specializing in holistic body-mind integration",
    avatarUrl: saszelineImage,
  },
  {
    id: 3,
    name: "Sami Hakala",
    role: "Teacher Facilitation",
    initials: "SH",
    specialties: ["Facilitation", "Education", "Coaching", "Retreats"],
    bio: "Expert facilitator focused on transformational learning experiences",
    avatarUrl: samiImage,
  },
  {
    id: 4,
    name: "Paco Hurricane",
    role: "Co-Founder WEZET & Teacher",
    initials: "PH",
    specialties: ["Breathwork", "Movement", "Bodywork", "Coaching"],
    bio: "Co-founder bringing dynamic energy to transformational practices",
    avatarUrl: pacoImage,
  },
];

export function getTeamMemberById(id: number): TeamMember | undefined {
  return TEAM_MEMBERS.find(member => member.id === id);
}

export function getTeamMembersBySpecialty(specialty: string): TeamMember[] {
  return TEAM_MEMBERS.filter(member => 
    member.specialties.includes(specialty)
  );
}
