import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet, BN } from '@project-serum/anchor';
import { RescueCipher, x25519 } from '@arcium-hq/client';
import { randomBytes } from 'crypto';
import { SalarySubmission, BenchmarkResult } from '../types';

// Import your IDL here
// import idl from '../idl/confidential_bench.json';

export class ConfidentialBenchClient {
  private connection: Connection;
  private program: Program | null = null;
  private provider: AnchorProvider | null = null;
  private mxePublicKey: Uint8Array;

  constructor(endpoint: string = 'http://127.0.0.1:8899') {
    this.connection = new Connection(endpoint, 'confirmed');
    this.mxePublicKey = new Uint8Array(32).fill(1); // Mock MXE public key
  }

  async initialize(wallet: any) {
    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
    });

    // Initialize program with IDL
    const programId = new PublicKey('ConfBenchProg11111111111111111111111111111');
    // this.program = new Program(idl, programId, this.provider);
  }

  private serializeSalarySubmission(submission: SalarySubmission): bigint[] {
    const result: bigint[] = [];
    
    // Serialize entries (simplified - pad to 5 entries)
    for (let i = 0; i < 5; i++) {
      if (i < submission.entries.length) {
        const entry = submission.entries[i];
        result.push(BigInt(entry.salary));
        result.push(BigInt(entry.experienceYears));
        result.push(BigInt(entry.roleLevel));
        result.push(BigInt(entry.locationCode));
      } else {
        // Pad with zeros
        result.push(0n, 0n, 0n, 0n);
      }
    }
    
    result.push(BigInt(submission.entryCount));
    result.push(BigInt(submission.companySize));
    
    return result;
  }

  encryptSalarySubmission(submission: SalarySubmission): {
    ciphertext: number[];
    publicKey: number[];
    nonce: BN;
  } {
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    const sharedSecret = x25519.getSharedSecret(privateKey, this.mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    const plaintext = this.serializeSalarySubmission(submission);
    
    const nonceBytes = randomBytes(16);
    const nonce = new BN(Array.from(nonceBytes));
    const ciphertext = cipher.encrypt(plaintext, nonceBytes);

    return {
      ciphertext: Array.from(ciphertext[0]),
      publicKey: Array.from(publicKey),
      nonce,
    };
  }

  // Mock submission for demo purposes
  async submitBenchmark(
    company1: SalarySubmission,
    company2: SalarySubmission,
    company3: SalarySubmission
  ): Promise<BenchmarkResult> {
    // Simulate encryption and computation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate simple benchmarks for demo
    const allSalaries: number[] = [];
    [company1, company2, company3].forEach(company => {
      company.entries.slice(0, company.entryCount).forEach(entry => {
        if (entry.salary > 0) allSalaries.push(entry.salary);
      });
    });

    allSalaries.sort((a, b) => a - b);
    
    const average = allSalaries.reduce((sum, sal) => sum + sal, 0) / allSalaries.length;
    const median = allSalaries[Math.floor(allSalaries.length / 2)];
    const p25 = allSalaries[Math.floor(allSalaries.length * 0.25)];
    const p75 = allSalaries[Math.floor(allSalaries.length * 0.75)];

    return {
      averageSalary: Math.round(average),
      medianSalary: median,
      percentile25: p25,
      percentile75: p75,
      totalEntries: allSalaries.length,
      averageExperience: 4,
    };
  }
}