# SAA-C03 study guide augmentation

Source (local only, not committed): `AWS Certified Solutions Architect Study Guide Associate (SAA-C03) Exam, 4th Edition (Ben Piper, David Clinton).pdf`

## How it was used
- TOC/chapter topics informed concept coverage across service chapters and architecture domains.
- Official SAA-C03 exam guide remains authority for weights/tasks.
- Item `sourceUrls` point at current docs.aws.amazon.com pages.

## What was not done
- No book review questions or answers copied.
- No items from `Q&A-SAA-C03.pdf`.
- PDF not stored in the repository.

## Match batch 1, checked 2026-11-24

Local reference, not committed:

- Filename: `AWS Certified Solutions Architect Study Guide  Associate (SAA-C03) Exam, 4th Edition (Ben Piper, David Clinton).pdf`
- Pages: 477
- SHA-256: `de7456e3fd3f1e0ea24870ae6a8e73615baaf2199ae62a0a15e35fadadbd70fb`

The contents pages were used to see which services the book places next to each other. No sentences, review questions, or answers were copied.

Official exam guide used for scope: `AWS-saa-c03_Exam-Guide.pdf`, 17 pages, SHA-256 `78e9aa30bd67653603a8a782aeeca1619a7576916fe9bb0588db49429e31033c`. The file says Version 1.0. The live exam guide pages on 2026-11-24 use the same domain weights and the same task titles, numbered 1.1 through 4.4, and they say AWS IAM Identity Center where the PDF says AWS Single Sign-On (AWS SSO).

The 50 new pairs cite docs.aws.amazon.com pages checked on 2026-11-24.

## Match batch 2, checked 2026-11-24

The same local textbook was on hand. Its contents headings were used again to see which services sit next to each other. No sentences, review questions, or answers were copied. SHA-256 and page count are unchanged: 477 pages, `de7456e3fd3f1e0ea24870ae6a8e73615baaf2199ae62a0a15e35fadadbd70fb`.

The same exam-guide PDF was opened again: Version 1.0, 17 pages, SHA-256 `78e9aa30bd67653603a8a782aeeca1619a7576916fe9bb0588db49429e31033c`. It still says AWS Single Sign-On (AWS SSO) and does not say IAM Identity Center. The live guide pages, checked 2026-11-24, still use the same domain weights, number the tasks 1.1 through 4.4, and say AWS IAM Identity Center.

The 50 new pairs cite the vendor pages linked from each pair. Those pages were checked on 2026-11-24. No prices were copied into the hints. The gp3 comparison uses the 20 percent per-GiB difference stated on the EBS general-purpose page. Glacier restore windows are the ranges stated on the Glacier storage-class page.

On 2026-11-26 the Snowball Edge page said that device is no longer available to new customers, so that contrast was replaced with Transfer Family versus DataSync. The Transfer Family, DataSync, API Gateway, Application Load Balancer, and domain 4 pages were opened again that day.

## Artifacts
- `q-saa-guide-01` … in `content/questions.json`
- `content/saa-practice-set.json` → `guideAugmentIds`
