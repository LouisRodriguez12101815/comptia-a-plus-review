# AWS Cloud Practitioner class: intake notes (not yet study content)

Status: intake only. Nothing here is published on the site, and nothing here has been checked against AWS documentation yet. Use it as the starting list for original notes, flashcards and questions.

## Source handling

- The class recordings and transcripts are creator content. Keep the raw files in `sources/private/aws-cloud-practitioner/` (Git ignores that folder). Do not commit them.
- Write all study material in original wording. Do not copy the instructor's phrasing.
- Transcripts are machine-generated and contain errors. Known fixes: "Download DB" means DynamoDB, "EC6" means EC2, "start instance" means Spot instance, "lamb" means Lambda.

## Sessions logged

| Date | Topics heard (our summary) | Local file name suggestion |
|---|---|---|
| 2026-10-28 | Scalability vs elasticity; benefits of cloud (lower upfront cost, built-in redundancy); free-tier accounts; why EFS does not work with Windows EC2 (NFS protocol) and which service to use instead | `2026-10-28.txt` |
| 2026-10-30 (a) | DynamoDB as a managed serverless database; Lambda vs EC2 billing model; Spot instances, interruption warning, mixing On-Demand with Spot | `2026-10-30-a.txt` |
| 2026-10-30 (b) | AWS Organizations and consolidated billing; chapter 3 start: support plans, Professional Services, Knowledge Center, forums, Trusted Advisor | `2026-10-30-b.txt` |

## Verify against current AWS documentation before turning into content

1. Lambda pricing basis (requests and execution time at the configured memory), compared with EC2 running-time billing.
2. Spot instances: current pricing model (the class used the word "bid"), maximum discount, length of the interruption notice.
3. EFS and Windows: confirm the stated incompatibility and the recommended Windows file service.
4. Organizations: what consolidated billing includes and whether it is something you enable.
5. Support plans: current plan names, prices and what Basic includes. Class slides may be out of date.
6. Trusted Advisor: current category names and which checks each plan includes.
7. Scalability vs elasticity: align wording with AWS's own definitions.

## Next steps

1. Map each topic to the current official AWS Certified Cloud Practitioner exam guide domains.
2. Add verified facts to `scripts/content-facts.json` with a primary source.
3. Write original four-choice questions with objective tags and explanations that contain the exact correct answer text.
4. Add a topic file and flashcards in the existing content format.
5. Add an exam registration for the AWS track, the same way the Security+ and Azure skeletons were added.
