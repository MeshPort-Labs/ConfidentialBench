use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    #[derive(Clone)]
    pub struct SalaryEntry {
        pub salary: u32,
        pub experience_years: u8,
        pub role_level: u8, // 1=Junior, 2=Mid, 3=Senior, 4=Lead
        pub location_code: u8, // Simple location encoding
    }

    #[derive(Clone)]
    pub struct SalarySubmission {
        pub entries: [SalaryEntry; 5], // Support up to 5 salary entries per company
        pub entry_count: u8,
        pub company_size: u8, // 1=Startup, 2=Mid, 3=Enterprise
    }

    pub struct BenchmarkResult {
        pub average_salary: u32,
        pub median_salary: u32,
        pub percentile_25: u32,
        pub percentile_75: u32,
        pub total_entries: u8,
        pub average_experience: u8,
    }

    #[instruction]
    pub fn compute_salary_benchmark(
        submission1: Enc<Shared, SalarySubmission>,
        submission2: Enc<Shared, SalarySubmission>,
        submission3: Enc<Shared, SalarySubmission>,
    ) -> Enc<Shared, BenchmarkResult> {
        let data1 = submission1.to_arcis();
        let data2 = submission2.to_arcis();
        let data3 = submission3.to_arcis();

        // Collect all salary entries
        let mut all_salaries = [0u32; 15]; // Max 15 entries (3 companies × 5 entries)
        let mut total_count = 0u8;
        let mut total_experience = 0u32;

        // Helper function to process company data
        fn process_company_data(
            data: &SalarySubmission,
            all_salaries: &mut [u32; 15],
            total_count: &mut u8,
            total_experience: &mut u32,
        ) {
            for i in 0..data.entry_count {
                if i < 5 && *total_count < 15 {
                    let idx = *total_count as usize;
                    all_salaries[idx] = data.entries[i as usize].salary;
                    *total_experience += data.entries[i as usize].experience_years as u32;
                    *total_count += 1;
                }
            }
        }

        // Process all three companies
        process_company_data(&data1, &mut all_salaries, &mut total_count, &mut total_experience);
        process_company_data(&data2, &mut all_salaries, &mut total_count, &mut total_experience);
        process_company_data(&data3, &mut all_salaries, &mut total_count, &mut total_experience);

        // Sort salaries for percentile calculations (simple bubble sort)
        for i in 0..(total_count as usize) {
            for j in (i + 1)..(total_count as usize) {
                if all_salaries[i] > all_salaries[j] {
                    let temp = all_salaries[i];
                    all_salaries[i] = all_salaries[j];
                    all_salaries[j] = temp;
                }
            }
        }

        // Calculate benchmarks
        let mut total_salary = 0u32;
        for i in 0..(total_count as usize) {
            total_salary += all_salaries[i];
        }

        let average_salary = if total_count > 0 {
            total_salary / (total_count as u32)
        } else {
            0
        };

        let median_salary = if total_count > 0 {
            all_salaries[(total_count / 2) as usize]
        } else {
            0
        };

        let percentile_25 = if total_count > 0 {
            all_salaries[(total_count / 4) as usize]
        } else {
            0
        };

        let percentile_75 = if total_count > 0 {
            all_salaries[(total_count * 3 / 4) as usize]
        } else {
            0
        };

        let average_experience = if total_count > 0 {
            (total_experience / (total_count as u32)) as u8
        } else {
            0
        };

        let result = BenchmarkResult {
            average_salary,
            median_salary,
            percentile_25,
            percentile_75,
            total_entries: total_count,
            average_experience,
        };

        submission1.owner.from_arcis(result)
    }
}