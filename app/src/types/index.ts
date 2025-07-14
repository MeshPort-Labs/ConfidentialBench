export interface SalaryEntry {
    salary: number;
    experienceYears: number;
    roleLevel: number; // 1=Junior, 2=Mid, 3=Senior, 4=Lead
    locationCode: number;
  }
  
  export interface SalarySubmission {
    entries: SalaryEntry[];
    entryCount: number;
    companySize: number; // 1=Startup, 2=Mid, 3=Enterprise
  }
  
  export interface BenchmarkResult {
    averageSalary: number;
    medianSalary: number;
    percentile25: number;
    percentile75: number;
    totalEntries: number;
    averageExperience: number;
    computationId?: string;
  }
  
  export const ROLE_LEVELS = {
    1: 'Junior',
    2: 'Mid-Level',
    3: 'Senior',
    4: 'Lead/Principal'
  } as const;
  
  export const COMPANY_SIZES = {
    1: 'Startup (1-50)',
    2: 'Mid-size (51-500)',
    3: 'Enterprise (500+)'
  } as const;
  
  export const LOCATIONS = {
    1: 'San Francisco Bay Area',
    2: 'New York City',
    3: 'Seattle',
    4: 'Austin',
    5: 'Remote'
  } as const;