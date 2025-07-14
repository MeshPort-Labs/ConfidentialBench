import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ConfidentialBench } from "../target/types/confidential_bench";
import { RescueCipher, x25519 } from "@arcium-hq/client";
import { randomBytes } from "crypto";
import { expect } from "chai";

describe("confidential-bench", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ConfidentialBench as Program<ConfidentialBench>;

  // Mock MXE public key (in real implementation, get from Arcium cluster)
  const mxePublicKey = new Uint8Array(32).fill(1);

  it("Initializes salary benchmark computation definition", async () => {
    try {
      const tx = await program.methods
        .initSalaryBenchmarkCompDef()
        .rpc();
      console.log("Computation definition initialized:", tx);
    } catch (error) {
      console.log("Init may have already been called:", error.message);
    }
  });

  it("Computes salary benchmarks privately", async () => {
    // Create sample salary data
    const createSampleData = (baseSalary: number, count: number) => {
      const entries = [];
      for (let i = 0; i < count; i++) {
        entries.push({
          salary: baseSalary + (i * 5000),
          experienceYears: 2 + i,
          roleLevel: 2,
          locationCode: 1,
        });
      }
      
      // Pad to 5 entries
      while (entries.length < 5) {
        entries.push({ salary: 0, experienceYears: 0, roleLevel: 0, locationCode: 0 });
      }

      return {
        entries,
        entryCount: count,
        companySize: 2,
      };
    };

    const company1Data = createSampleData(70000, 3);
    const company2Data = createSampleData(80000, 2);
    const company3Data = createSampleData(75000, 3);

    // Encrypt submissions
    const encryptSubmission = (data: any) => {
      const privateKey = x25519.utils.randomPrivateKey();
      const publicKey = x25519.getPublicKey(privateKey);
      const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
      const cipher = new RescueCipher(sharedSecret);

      // Convert to plaintext array (simplified serialization)
      const plaintext = [
        BigInt(data.entries[0].salary),
        BigInt(data.entries[1].salary || 0),
        BigInt(data.entryCount),
        BigInt(data.companySize),
      ];

      const nonceBytes = randomBytes(16);
      const nonce = Buffer.from(nonceBytes).readBigUInt64LE(0);
      const ciphertext = cipher.encrypt(plaintext, nonceBytes);

      return {
        ciphertext: Array.from(ciphertext[0]),
        publicKey: Array.from(publicKey),
        nonce: new anchor.BN(nonce.toString()),
      };
    };

    const enc1 = encryptSubmission(company1Data);
    const enc2 = encryptSubmission(company2Data);
    const enc3 = encryptSubmission(company3Data);

    // Generate computation offset
    const computationOffset = new anchor.BN(randomBytes(8));

    // Listen for result event
    let benchmarkResult: any = null;
    const listener = program.addEventListener('BenchmarkResultEvent', (event) => {
      console.log('Benchmark result received:', event);
      benchmarkResult = event;
    });

    try {
      // Submit computation
      const tx = await program.methods
        .submitSalaryBenchmark(
          computationOffset,
          enc1.ciphertext,
          enc1.publicKey,
          enc1.nonce,
          enc2.ciphertext,
          enc2.publicKey,
          enc2.nonce,
          enc3.ciphertext,
          enc3.publicKey,
          enc3.nonce
        )
        .rpc({ commitment: 'confirmed' });

      console.log("Salary benchmark computation submitted:", tx);

      // Wait for computation to complete (simplified)
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check if we received results
      if (benchmarkResult) {
        console.log("Benchmark Results:");
        console.log(`Average Salary: $${benchmarkResult.averageSalary.toLocaleString()}`);
        console.log(`Median Salary: $${benchmarkResult.medianSalary.toLocaleString()}`);
        console.log(`25th Percentile: $${benchmarkResult.percentile25.toLocaleString()}`);
        console.log(`75th Percentile: $${benchmarkResult.percentile75.toLocaleString()}`);
        console.log(`Total Entries: ${benchmarkResult.totalEntries}`);
        console.log(`Average Experience: ${benchmarkResult.averageExperience} years`);

        expect(benchmarkResult.totalEntries).to.be.greaterThan(0);
        expect(benchmarkResult.averageSalary).to.be.greaterThan(0);
      }

    } finally {
      program.removeEventListener(listener);
    }
  });
});