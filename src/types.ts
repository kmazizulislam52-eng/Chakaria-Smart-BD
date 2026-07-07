export interface Voter {
  id: string;
  nid: string;       // National ID card number
  voterNo: string;   // Local voter number / slip ID
  serialNo: number;  // Serial number in the voter list of that center
  nameBn: string;    // Name in Bangla
  nameEn: string;    // Name in English
  fatherName: string;
  motherName: string;
  dob: string;       // Date of Birth
  gender: 'Male' | 'Female' | 'Other';
  centerName: string;// Voting center name
  boothNo: string;   // Booth / Room number
  area: string;      // Area / Ward / Village
  constituency: string; // Parliamentary Constituency, e.g., ঢাকা-১০ (Dhaka-10)
  isVoted?: boolean; // Whether they have already voted (useful for tracking turnout)
  createdAt?: number;
}

export interface CenterStats {
  centerName: string;
  totalVoters: number;
  maleVoters: number;
  femaleVoters: number;
  votedCount: number;
}

export interface DatabaseStats {
  totalVoters: number;
  totalMale: number;
  totalFemale: number;
  totalCenters: number;
  totalVoted: number;
  constituencyName: string;
}
