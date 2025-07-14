use anchor_lang::prelude::*;
use arcium_anchor::{
    comp_def_offset, derive_cluster_pda, derive_comp_def_pda, derive_comp_pda, 
    derive_execpool_pda, derive_mempool_pda, derive_mxe_pda, init_comp_def, 
    queue_computation, ARCIUM_CLOCK_ACCOUNT_ADDRESS, ARCIUM_STAKING_POOL_ACCOUNT_ADDRESS,
};
use arcium_client::idl::arcium::{
    accounts::{ClockAccount, Cluster, ComputationDefinitionAccount, PersistentMXEAccount, StakingPoolAccount},
    program::Arcium,
    types::{Argument, ComputationOutputs},
    ID_CONST as ARCIUM_PROG_ID,
};
use arcium_macros::{
    arcium_callback, arcium_program, callback_accounts, init_computation_definition_accounts,
    queue_computation_accounts,
};

const COMP_DEF_OFFSET_SALARY_BENCHMARK: u32 = comp_def_offset("compute_salary_benchmark");

declare_id!("ConfBenchProg11111111111111111111111111111");

#[arcium_program]
pub mod confidential_bench {
    use super::*;

    pub fn init_salary_benchmark_comp_def(ctx: Context<InitSalaryBenchmarkCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None)?;
        msg!("Salary benchmark computation definition initialized");
        Ok(())
    }

    pub fn submit_salary_benchmark(
        ctx: Context<SubmitSalaryBenchmark>,
        computation_offset: u64,
        // Company 1 encrypted submission
        submission1_ciphertext: [u8; 32],
        submission1_pubkey: [u8; 32],
        submission1_nonce: u128,
        // Company 2 encrypted submission
        submission2_ciphertext: [u8; 32],
        submission2_pubkey: [u8; 32],
        submission2_nonce: u128,
        // Company 3 encrypted submission
        submission3_ciphertext: [u8; 32],
        submission3_pubkey: [u8; 32],
        submission3_nonce: u128,
    ) -> Result<()> {
        let args = vec![
            // Company 1 submission
            Argument::ArcisPubkey(submission1_pubkey),
            Argument::PlaintextU128(submission1_nonce),
            Argument::EncryptedU128(submission1_ciphertext),
            // Company 2 submission
            Argument::ArcisPubkey(submission2_pubkey),
            Argument::PlaintextU128(submission2_nonce),
            Argument::EncryptedU128(submission2_ciphertext),
            // Company 3 submission
            Argument::ArcisPubkey(submission3_pubkey),
            Argument::PlaintextU128(submission3_nonce),
            Argument::EncryptedU128(submission3_ciphertext),
        ];

        msg!("Queueing salary benchmark computation with {} companies", 3);
        queue_computation(ctx.accounts, computation_offset, args, vec![], None)?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "compute_salary_benchmark")]
    pub fn salary_benchmark_callback(
        ctx: Context<SalaryBenchmarkCallback>,
        output: ComputationOutputs,
    ) -> Result<()> {
        let bytes = if let ComputationOutputs::Bytes(bytes) = output {
            bytes
        } else {
            return Err(ErrorCode::AbortedComputation.into());
        };

        // Extract benchmark results from the encrypted output
        // Note: This is a simplified extraction - in reality you'd need proper deserialization
        let average_salary = u32::from_le_bytes([bytes[48], bytes[49], bytes[50], bytes[51]]);
        let median_salary = u32::from_le_bytes([bytes[52], bytes[53], bytes[54], bytes[55]]);
        let percentile_25 = u32::from_le_bytes([bytes[56], bytes[57], bytes[58], bytes[59]]);
        let percentile_75 = u32::from_le_bytes([bytes[60], bytes[61], bytes[62], bytes[63]]);
        let total_entries = bytes[64];
        let average_experience = bytes[65];

        emit!(BenchmarkResultEvent {
            average_salary,
            median_salary,
            percentile_25,
            percentile_75,
            total_entries,
            average_experience,
            computation_id: ctx.accounts.comp_def_account.key(),
        });

        msg!("Salary benchmark computation completed: avg=${}, median=${}, total_entries={}", 
             average_salary, median_salary, total_entries);
        Ok(())
    }
}

#[event]
pub struct BenchmarkResultEvent {
    pub average_salary: u32,
    pub median_salary: u32,
    pub percentile_25: u32,
    pub percentile_75: u32,
    pub total_entries: u8,
    pub average_experience: u8,
    pub computation_id: Pubkey,
}

// Account structs
#[init_computation_definition_accounts("compute_salary_benchmark", payer)]
#[derive(Accounts)]
pub struct InitSalaryBenchmarkCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, PersistentMXEAccount>>,
    #[account(mut)]
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[queue_computation_accounts("compute_salary_benchmark", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct SubmitSalaryBenchmark<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, PersistentMXEAccount>,
    #[account(mut, address = derive_mempool_pda!())]
    pub mempool_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_execpool_pda!())]
    pub executing_pool: UncheckedAccount<'info>,
    #[account(mut, address = derive_comp_pda!(computation_offset))]
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_SALARY_BENCHMARK))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(mut, address = derive_cluster_pda!(mxe_account))]
    pub cluster_account: Account<'info, Cluster>,
    #[account(mut, address = ARCIUM_STAKING_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Account<'info, StakingPoolAccount>,
    #[account(address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("compute_salary_benchmark", payer)]
#[derive(Accounts)]
pub struct SalaryBenchmarkCallback<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_SALARY_BENCHMARK))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Computation was aborted")]
    AbortedComputation,
}