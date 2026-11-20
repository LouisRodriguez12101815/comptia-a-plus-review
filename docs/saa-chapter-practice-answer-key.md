# SAA chapter-mapped practice set (q-saa-chapter-01..26)

## q-saa-chapter-01 (ch01 · objective 1.1)

**Prompt:** A new AWS organization must keep daily administration off the root user while still allowing break-glass recovery. Which baseline is most appropriate?

- A. Enable root MFA, store root credentials offline, and use IAM Identity Center or IAM roles for daily work **← correct**
- B. Share root credentials among platform engineers for speed
- C. Create long-lived root access keys for CI/CD
- D. Disable CloudTrail to reduce noise from root logins

**Explanation:**

Enable root MFA, store root credentials offline, and use IAM Identity Center or IAM roles for daily work — Correct. Root is break-glass only; MFA plus federation/roles is the standard baseline.
Share root credentials among platform engineers for speed — Incorrect. Root credentials must never be shared.
Create long-lived root access keys for CI/CD — Incorrect. Root access keys are strongly discouraged.
Disable CloudTrail to reduce noise from root logins — Incorrect. CloudTrail should record account activity, including sensitive root use.


## q-saa-chapter-02 (ch01 · objective 4.2)

**Prompt:** Leadership wants a first-pass cost model before any production EC2 is launched. Which approach best supports early architecture decisions?

- A. Buy the largest Reserved Instance footprint immediately without measurements
- B. Estimate usage with the Pricing Calculator, then revisit after tagging and Cost Explorer baselines exist **← correct**
- C. Ignore data transfer until the first invoice arrives
- D. Turn off all billing alerts until go-live

**Explanation:**

Buy the largest Reserved Instance footprint immediately without measurements — Incorrect. Blind long-term commitments before measurement often lock in waste.
Estimate usage with the Pricing Calculator, then revisit after tagging and Cost Explorer baselines exist — Correct. Early estimates plus later measured baselines support iterative cost design.
Ignore data transfer until the first invoice arrives — Incorrect. Data transfer can dominate hybrid and multi-AZ designs.
Turn off all billing alerts until go-live — Incorrect. Alerts help catch surprises early, not only after launch.


## q-saa-chapter-03 (ch02 · objective 3.2)

**Prompt:** An API tier needs horizontal scale based on CPU and must replace unhealthy instances automatically. Which combination fits?

- A. One oversized instance with termination protection and no load balancer
- B. Manual AMI copies once a quarter only
- C. An Auto Scaling group with ELB health checks and a launch template **← correct**
- D. Disable health checks so failed instances stay in service

**Explanation:**

One oversized instance with termination protection and no load balancer — Incorrect. A single protected instance is a bottleneck and SPOF.
Manual AMI copies once a quarter only — Incorrect. Quarterly AMI copy is not automated scaling.
An Auto Scaling group with ELB health checks and a launch template — Correct. ASG + health checks + launch template provides elastic, replaceable capacity.
Disable health checks so failed instances stay in service — Incorrect. Health checks are required for automatic replacement.


## q-saa-chapter-04 (ch02 · objective 2.2)

**Prompt:** A stateful web tier must remain available if an Availability Zone fails. Which design meets this?

- A. Run a single large instance in one AZ
- B. Use only instance store without snapshots in one AZ
- C. Disable health checks to keep failing targets in service
- D. Deploy instances across at least two AZs behind an Elastic Load Balancer **← correct**

**Explanation:**

Run a single large instance in one AZ — Incorrect. One instance in one AZ fails when that AZ or host fails.
Use only instance store without snapshots in one AZ — Incorrect. Instance store in one AZ is neither durable nor multi-AZ.
Disable health checks to keep failing targets in service — Incorrect. Health checks must remove bad targets; disabling them harms availability.
Deploy instances across at least two AZs behind an Elastic Load Balancer — Correct. Multi-AZ with load balancing removes a single AZ as a single point of failure.


## q-saa-chapter-05 (ch03 · objective 1.2)

**Prompt:** App instances in private subnets must pull patches from the internet without accepting inbound internet connections. Which pattern is standard?

- A. NAT gateway in a public subnet with a default route from private subnets to the NAT **← correct**
- B. Attach an internet gateway as the default route for private-only instances
- C. Assign public IPs and open SSH from 0.0.0.0/0 to each private instance
- D. Deny all egress in the network ACL permanently

**Explanation:**

NAT gateway in a public subnet with a default route from private subnets to the NAT — Correct. NAT provides outbound-initiated access while instances stay private.
Attach an internet gateway as the default route for private-only instances — Incorrect. Private-only hosts should not use IGW default routes.
Assign public IPs and open SSH from 0.0.0.0/0 to each private instance — Incorrect. Public IPs plus open SSH defeat private tier design.
Deny all egress in the network ACL permanently — Incorrect. Blocking all egress breaks patching and updates.


## q-saa-chapter-06 (ch03 · objective 4.4)

**Prompt:** Heavy S3 API traffic from private subnets currently hairpins through a NAT gateway. Which change often reduces data-processing charges while keeping traffic private?

- A. Make the bucket a public website endpoint
- B. Add a gateway VPC endpoint for S3 and update routes so S3 traffic uses the endpoint **← correct**
- C. Disable all bucket policies
- D. Open security groups to 0.0.0.0/0 on all ports

**Explanation:**

Make the bucket a public website endpoint — Incorrect. Public websites expose objects.
Add a gateway VPC endpoint for S3 and update routes so S3 traffic uses the endpoint — Correct. S3 gateway endpoints keep traffic on the AWS network and avoid NAT data processing for that path.
Disable all bucket policies — Incorrect. Bucket policies remain part of access control.
Open security groups to 0.0.0.0/0 on all ports — Incorrect. Open security groups are not a private connectivity design.


## q-saa-chapter-07 (ch04 · objective 3.3)

**Prompt:** A read-heavy relational workload on Aurora must offload SELECTs without moving writes off the primary. What should you use?

- A. Delete secondary indexes to force table scans on the writer
- B. Disable the buffer cache
- C. Aurora Replicas with the reader endpoint **← correct**
- D. Run peak ETL full scans on the writer during business hours

**Explanation:**

Delete secondary indexes to force table scans on the writer — Incorrect. Dropping indexes harms read performance.
Disable the buffer cache — Incorrect. Buffer cache is essential for performance.
Aurora Replicas with the reader endpoint — Correct. Reader endpoints distribute reads to replicas while writes stay on the writer.
Run peak ETL full scans on the writer during business hours — Incorrect. Heavy ETL on the writer contends with OLTP.


## q-saa-chapter-08 (ch04 · objective 2.2)

**Prompt:** RDS needs automatic failover to a standby in another Availability Zone with minimal operational reinstall. Which feature provides this?

- A. A single-AZ instance with backups disabled
- B. Only increasing instance size in one AZ
- C. Storing the only copy on a developer laptop
- D. RDS Multi-AZ deployment **← correct**

**Explanation:**

A single-AZ instance with backups disabled — Incorrect. Single-AZ without backups is fragile.
Only increasing instance size in one AZ — Incorrect. Larger size improves capacity, not AZ failure tolerance.
Storing the only copy on a developer laptop — Incorrect. Laptops are not resilient cloud databases.
RDS Multi-AZ deployment — Correct. Multi-AZ maintains a synchronous standby and fails over on primary failure.


## q-saa-chapter-09 (ch05 · objective 1.1)

**Prompt:** EC2 workers must read one DynamoDB table without embedding static access keys. What is the correct credential pattern?

- A. An instance profile role with least-privilege DynamoDB permissions **← correct**
- B. IAM user access keys baked into the AMI
- C. Account root keys in environment files on disk
- D. A publicly writable DynamoDB table with no authentication

**Explanation:**

An instance profile role with least-privilege DynamoDB permissions — Correct. Instance profiles provide temporary role credentials.
IAM user access keys baked into the AMI — Incorrect. Static keys in AMIs leak and rotate poorly.
Account root keys in environment files on disk — Incorrect. Root keys are not for applications.
A publicly writable DynamoDB table with no authentication — Incorrect. Public unauthenticated tables fail security requirements.


## q-saa-chapter-10 (ch05 · objective 1.3)

**Prompt:** Application database passwords must rotate and must not live in git. Where should they be stored?

- A. Plain-text passwords committed to the application repository
- B. AWS Secrets Manager or SSM Parameter Store SecureString with IAM-controlled retrieval **← correct**
- C. Passwords posted in a public wiki page
- D. Hard-coded strings inside AMI user data baked permanently

**Explanation:**

Plain-text passwords committed to the application repository — Incorrect. Secrets in git leak through history and clones.
AWS Secrets Manager or SSM Parameter Store SecureString with IAM-controlled retrieval — Correct. Managed secret stores support controlled retrieval and rotation patterns.
Passwords posted in a public wiki page — Incorrect. Public docs are not secret storage.
Hard-coded strings inside AMI user data baked permanently — Incorrect. Baked AMI secrets freeze credentials.


## q-saa-chapter-11 (ch06 · objective 3.1)

**Prompt:** A media archive needs high durability, HTTP access, and lifecycle movement from frequent to rare access. Which primary store fits?

- A. A single EBS volume attached to one instance as the only copy
- B. Instance store on one host
- C. Amazon S3 with lifecycle rules to colder classes as objects age **← correct**
- D. Local laptop disks as the system of record

**Explanation:**

A single EBS volume attached to one instance as the only copy — Incorrect. Single EBS volumes are AZ-scoped and not multi-client object stores.
Instance store on one host — Incorrect. Instance store is ephemeral.
Amazon S3 with lifecycle rules to colder classes as objects age — Correct. S3 provides durable object storage with lifecycle tiering.
Local laptop disks as the system of record — Incorrect. Laptops are not durable enterprise archives.


## q-saa-chapter-12 (ch06 · objective 1.3)

**Prompt:** Regulated objects in S3 must be encrypted at rest with customer-managed keys and auditable key use. Which control fits?

- A. Disable encryption to improve performance
- B. Client-side XOR with a passphrase committed to source control
- C. Versioning only, without encryption
- D. SSE-KMS using a customer managed KMS key and key policies **← correct**

**Explanation:**

Disable encryption to improve performance — Incorrect. Turning encryption off fails the requirement.
Client-side XOR with a passphrase committed to source control — Incorrect. Homegrown crypto with secrets in git is unsafe.
Versioning only, without encryption — Incorrect. Versioning is not encryption.
SSE-KMS using a customer managed KMS key and key policies — Correct. SSE-KMS CMKs provide controllable key policy and CloudTrail-visible use.


## q-saa-chapter-13 (ch07 · objective 2.2)

**Prompt:** Route 53 should shift users from a primary regional endpoint to a secondary when health checks fail. Which routing policy supports active-passive failover?

- A. Failover routing with health checks **← correct**
- B. Simple routing with one record and no health check
- C. Weighted routing with equal weights and no health checks
- D. Geoproximity only with no health evaluation

**Explanation:**

Failover routing with health checks — Correct. Failover routing is active-passive and uses health checks.
Simple routing with one record and no health check — Incorrect. Simple routing does not fail over on health.
Weighted routing with equal weights and no health checks — Incorrect. Weighted without health still sends traffic to unhealthy targets.
Geoproximity only with no health evaluation — Incorrect. Geoproximity alone is not failover.


## q-saa-chapter-14 (ch07 · objective 3.4)

**Prompt:** A global audience needs latency-based DNS answers to the nearest healthy regional API. Which Route 53 approach fits?

- A. A single A record to one instance in one AZ with no health check
- B. Latency-based routing with health checks on regional endpoints **← correct**
- C. Turning off DNS entirely and hard-coding IPs in mobile apps
- D. Using only TXT records for API routing

**Explanation:**

A single A record to one instance in one AZ with no health check — Incorrect. One instance in one AZ is neither global nor highly available.
Latency-based routing with health checks on regional endpoints — Correct. Latency routing steers users to lower-latency healthy regions.
Turning off DNS entirely and hard-coding IPs in mobile apps — Incorrect. Hard-coded IPs defeat DNS-based traffic management.
Using only TXT records for API routing — Incorrect. TXT records are not for API endpoint routing.


## q-saa-chapter-15 (ch08 · objective 3.4)

**Prompt:** Static marketing assets must be cached at the edge with TLS while the origin remains an S3 bucket. Which design is appropriate?

- A. A single t3.nano in one Region serving files from instance store
- B. Public RDS endpoints used as a static file origin
- C. Amazon CloudFront distribution with an S3 origin and ACM certificate on the distribution **← correct**
- D. FTP from a corporate desktop to each user

**Explanation:**

A single t3.nano in one Region serving files from instance store — Incorrect. Tiny single-instance origins do not scale globally.
Public RDS endpoints used as a static file origin — Incorrect. RDS is a database, not a static CDN origin.
Amazon CloudFront distribution with an S3 origin and ACM certificate on the distribution — Correct. CloudFront + S3 is the standard global static content pattern.
FTP from a corporate desktop to each user — Incorrect. Desktop FTP is not a content delivery architecture.


## q-saa-chapter-16 (ch08 · objective 3.1)

**Prompt:** Popular downloadable objects cause repeated origin GETs and rising data transfer. How does CloudFront help performance and often cost?

- A. CloudFront always disables caching permanently by default
- B. CloudFront deletes S3 lifecycle rules automatically
- C. TLS must be disabled to save money
- D. Edge caches satisfy repeat viewers without refetching the origin every time **← correct**

**Explanation:**

CloudFront always disables caching permanently by default — Incorrect. Caching is a primary benefit, not permanently disabled.
CloudFront deletes S3 lifecycle rules automatically — Incorrect. CloudFront does not remove lifecycle configuration as a cost feature.
TLS must be disabled to save money — Incorrect. TLS remains standard for public HTTPS distributions.
Edge caches satisfy repeat viewers without refetching the origin every time — Correct. Cache hits reduce origin load and repeated data transfer.


## q-saa-chapter-17 (ch09 · objective 2.1)

**Prompt:** Order intake must keep accepting requests when fulfillment workers are slow or briefly unavailable. Which decoupling service fits between API and workers?

- A. Amazon SQS **← correct**
- B. Tight synchronous calls with no queue and no retries
- C. Jobs stored only in one instance's memory
- D. Public unauthenticated S3 listings as a work queue

**Explanation:**

Amazon SQS — Correct. SQS buffers work so producers and consumers scale independently.
Tight synchronous calls with no queue and no retries — Incorrect. Tight coupling propagates backpressure and failures.
Jobs stored only in one instance's memory — Incorrect. In-memory queues die with the instance.
Public unauthenticated S3 listings as a work queue — Incorrect. Public S3 listings are not a proper work queue.


## q-saa-chapter-18 (ch09 · objective 3.5)

**Prompt:** A multi-step workflow needs retries, branching, and visible state across Lambda tasks. Which service is purpose-built?

- A. A single SSH script with no durable state
- B. AWS Step Functions **← correct**
- C. Manual spreadsheet tracking only
- D. Disabling all dead-letter queues everywhere

**Explanation:**

A single SSH script with no durable state — Incorrect. Ad-hoc scripts lack durable orchestration state.
AWS Step Functions — Correct. Step Functions orchestrates steps with state, retries, and branches.
Manual spreadsheet tracking only — Incorrect. Spreadsheets are not runtime orchestration.
Disabling all dead-letter queues everywhere — Incorrect. DLQs help surface poison messages; removing them hides failures.


## q-saa-chapter-19 (ch10 · objective 2.1)

**Prompt:** A notification must fan out the same event to Lambda, SQS, and an HTTPS subscriber. Which service fits?

- A. AWS WAF
- B. Amazon EFS
- C. Amazon SNS **← correct**
- D. AWS Budgets

**Explanation:**

AWS WAF — Incorrect. WAF filters web requests.
Amazon EFS — Incorrect. EFS is a filesystem.
Amazon SNS — Correct. SNS pub/sub fans out messages to multiple subscribers.
AWS Budgets — Incorrect. Budgets alert on cost.


## q-saa-chapter-20 (ch10 · objective 2.2)

**Prompt:** Disaster recovery for critical S3 datasets requires automatic copies in another Region. Which feature applies?

- A. Lifecycle expiration only
- B. Deleting versioning to simplify operations
- C. Relying only on CloudFront cache as the DR copy
- D. S3 Cross-Region Replication **← correct**

**Explanation:**

Lifecycle expiration only — Incorrect. Expiration deletes objects; it does not create a DR copy.
Deleting versioning to simplify operations — Incorrect. Versioning supports recoverability.
Relying only on CloudFront cache as the DR copy — Incorrect. A CDN cache is not the durable system of record for DR.
S3 Cross-Region Replication — Correct. CRR replicates objects asynchronously to another Region.


## q-saa-chapter-21 (ch11 · objective 3.2)

**Prompt:** A TCP service needs ultra-low latency load balancing and preservation of client source IP at very high connection rates. Which load balancer type is designed for this?

- A. Network Load Balancer **← correct**
- B. Application Load Balancer used only for layer-4 TCP without HTTP features
- C. AWS WAF without any load balancer
- D. Amazon SES

**Explanation:**

Network Load Balancer — Correct. NLB operates at layer 4 for high-performance TCP/UDP workloads and can preserve source IP.
Application Load Balancer used only for layer-4 TCP without HTTP features — Incorrect. ALB is layer 7 for HTTP features; NLB is the L4 high-performance choice.
AWS WAF without any load balancer — Incorrect. WAF needs an association target and is not an L4 load balancer.
Amazon SES — Incorrect. SES sends email.


## q-saa-chapter-22 (ch11 · objective 3.5)

**Prompt:** Near-real-time clickstream events must be ingested continuously before analytics consumers process them. Which service is a common fit?

- A. S3 Glacier Deep Archive as the hot stream
- B. Amazon Kinesis Data Streams **← correct**
- C. AWS Budgets stream mode
- D. AWS Certificate Manager stream

**Explanation:**

S3 Glacier Deep Archive as the hot stream — Incorrect. Glacier is cold archive, not hot streaming ingest.
Amazon Kinesis Data Streams — Correct. Kinesis streams continuous high-throughput event data.
AWS Budgets stream mode — Incorrect. Budgets track cost.
AWS Certificate Manager stream — Incorrect. ACM manages certificates.


## q-saa-chapter-23 (ch12 · objective 1.2)

**Prompt:** A public web application must mitigate common HTTP exploits such as injection attacks at layer 7. Which service is purpose-built?

- A. AWS Shield alone without application rules
- B. Amazon Macie only
- C. AWS WAF associated with CloudFront or an Application Load Balancer **← correct**
- D. AWS Backup

**Explanation:**

AWS Shield alone without application rules — Incorrect. Shield focuses on DDoS; it is not a replacement for L7 application rules.
Amazon Macie only — Incorrect. Macie discovers sensitive data in S3, not HTTP exploits.
AWS WAF associated with CloudFront or an Application Load Balancer — Correct. WAF evaluates web requests against rules for exploits and bots.
AWS Backup — Incorrect. Backup protects recovery points, not runtime HTTP filtering.


## q-saa-chapter-24 (ch12 · objective 1.1)

**Prompt:** Member accounts must be blocked from leaving the organization or disabling critical security services except a break-glass security account. Which control enforces this centrally?

- A. A single security group rule in one VPC
- B. S3 Object Lock on unrelated application buckets
- C. Closing the billing console UI
- D. Service control policies (SCPs) in AWS Organizations **← correct**

**Explanation:**

A single security group rule in one VPC — Incorrect. Security groups filter network traffic only.
S3 Object Lock on unrelated application buckets — Incorrect. Object Lock is for object retention.
Closing the billing console UI — Incorrect. Billing UI access is unrelated to service API guardrails.
Service control policies (SCPs) in AWS Organizations — Correct. SCPs set permission guardrails across member accounts.


## q-saa-chapter-25 (ch13 · objective 4.2)

**Prompt:** Compute Optimizer reports an EC2 instance is consistently over-provisioned on CPU and memory. What is the cost-aware next step?

- A. Rightsize or stop/schedule the instance after validating performance needs **← correct**
- B. Immediately double the instance size
- C. Ignore the recommendation permanently without review
- D. Move the workload to a larger Dedicated Host without analysis

**Explanation:**

Rightsize or stop/schedule the instance after validating performance needs — Correct. Rightsizing or scheduling removes paid idle capacity while preserving required performance.
Immediately double the instance size — Incorrect. Upsizing increases cost without evidence of need.
Ignore the recommendation permanently without review — Incorrect. Ignoring sustained waste leaves money on the table.
Move the workload to a larger Dedicated Host without analysis — Incorrect. Larger hosts need justification.


## q-saa-chapter-26 (ch13 · objective 4.4)

**Prompt:** A cost review finds unattached Elastic IPs and idle load balancers in a non-production account. What should operators do?

- A. Assume idle networking resources never incur charges
- B. Release unused Elastic IPs and delete idle load balancers after confirmation they are not required **← correct**
- C. Allocate more unused Elastic IPs for unknown future projects immediately
- D. Attach idle Elastic IPs to random stopped instances without need

**Explanation:**

Assume idle networking resources never incur charges — Incorrect. They are not free when idle or unattached.
Release unused Elastic IPs and delete idle load balancers after confirmation they are not required — Correct. Unattached EIPs and idle load balancers incur charges; reclaim them.
Allocate more unused Elastic IPs for unknown future projects immediately — Incorrect. Creating more unused resources increases waste.
Attach idle Elastic IPs to random stopped instances without need — Incorrect. Random attachments are not intentional design.

# Phase A expanded set (q-saa-chapter-27..32)

## q-saa-chapter-27 (ch01 · objective 1.1)

**Prompt:** A growing company wants one workforce identity plane across many AWS accounts, with temporary credentials and centralized permission assignment. Which baseline fits best?

- A. Create unique long-term IAM user access keys in every account and email them to staff
- B. Share a single IAM user password across accounts for simplicity
- C. Use AWS IAM Identity Center (successor to AWS SSO) with permission sets mapped to accounts and groups **← correct**
- D. Disable MFA organization-wide to reduce login friction

**Explanation:**

Create unique long-term IAM user access keys in every account and email them to staff — Incorrect. Long-term keys per account do not scale and are hard to rotate and audit.
Share a single IAM user password across accounts for simplicity — Incorrect. Shared passwords violate least privilege and accountability.
Use AWS IAM Identity Center (successor to AWS SSO) with permission sets mapped to accounts and groups — Correct. Identity Center centralizes workforce access with temporary sessions via permission sets.
Disable MFA organization-wide to reduce login friction — Incorrect. MFA strengthens access control and should not be disabled for convenience.


## q-saa-chapter-28 (ch01 · objective 4.2)

**Prompt:** Finance needs ongoing visibility into which teams drive EC2 spend after launch, not only a pre-build estimate. Which combination best supports chargeback conversations?

- A. Skip resource tags and wait for the monthly consolidated invoice alone
- B. Apply a consistent cost allocation tagging standard, activate cost allocation tags, and analyze spend in Cost Explorer **← correct**
- C. Delete CloudWatch metrics to lower the bill before reviewing cost drivers
- D. Turn off AWS Budgets so alerts never interrupt engineering

**Explanation:**

Skip resource tags and wait for the monthly consolidated invoice alone — Incorrect. Untagged resources block team-level chargeback and trend analysis.
Apply a consistent cost allocation tagging standard, activate cost allocation tags, and analyze spend in Cost Explorer — Correct. Tags plus Cost Explorer support measured, ongoing cost attribution after launch.
Delete CloudWatch metrics to lower the bill before reviewing cost drivers — Incorrect. Removing metrics harms operations and does not create team cost visibility.
Turn off AWS Budgets so alerts never interrupt engineering — Incorrect. Budgets and alerts help catch overruns early rather than hiding them.


## q-saa-chapter-29 (ch02 · objective 3.2)

**Prompt:** A new EC2 application needs durable block storage with predictable baseline SSD performance and the ability to tune throughput independently of size. The workload is not a latency-sensitive database that needs extreme IOPS. Which EBS choice fits?

- A. Instance store only, with no EBS volume, for the only copy of application data
- B. Magnetic cold HDD as the boot and data volume for a latency-sensitive API
- C. A single local USB drive attached to one laptop as the shared data plane
- D. General Purpose SSD (gp3) volumes sized for capacity, with IOPS/throughput set to the measured need **← correct**

**Explanation:**

Instance store only, with no EBS volume, for the only copy of application data — Incorrect. Instance store is ephemeral and tied to the host lifetime.
Magnetic cold HDD as the boot and data volume for a latency-sensitive API — Incorrect. Cold HDD is for infrequent throughput-oriented workloads, not general low-latency APIs.
A single local USB drive attached to one laptop as the shared data plane — Incorrect. Local laptop storage is not durable cloud block storage.
General Purpose SSD (gp3) volumes sized for capacity, with IOPS/throughput set to the measured need — Correct. gp3 provides durable SSD performance with independently configurable IOPS and throughput for many general workloads.


## q-saa-chapter-30 (ch02 · objective 4.2)

**Prompt:** A stateless image-processing fleet can tolerate interruptions and already runs behind an Auto Scaling group. Leadership wants lower compute cost than steady On-Demand for the burst workers. Which approach fits?

- A. Purchase Dedicated Hosts for every burst worker regardless of utilization
- B. Disable Auto Scaling and run one oversized On-Demand instance continuously
- C. Use EC2 Spot capacity for the interruption-tolerant workers, with On-Demand or diversified capacity as a fallback path **← correct**
- D. Bake root user access keys into the AMI so workers start faster

**Explanation:**

Purchase Dedicated Hosts for every burst worker regardless of utilization — Incorrect. Dedicated Hosts target compliance/licensing isolation, not generic burst savings.
Disable Auto Scaling and run one oversized On-Demand instance continuously — Incorrect. A single always-on instance wastes money and removes elasticity.
Use EC2 Spot capacity for the interruption-tolerant workers, with On-Demand or diversified capacity as a fallback path — Correct. Spot can discount spare capacity for fault-tolerant fleets when interruption handling exists.
Bake root user access keys into the AMI so workers start faster — Incorrect. Root keys must not be embedded; this is a security failure, not a cost design.


## q-saa-chapter-31 (ch03 · objective 1.2)

**Prompt:** Web instances must accept HTTPS only from an Application Load Balancer security group, not from the public internet. Which control is the standard least-privilege pattern?

- A. Open instance security group TCP 443 to 0.0.0.0/0 and rely on obscurity
- B. Allow inbound TCP 443 on the instance security group only from the ALB security group **← correct**
- C. Disable all security groups and use only a wide-open network ACL allow-all rule
- D. Publish each instance with a public Elastic IP and no load balancer

**Explanation:**

Open instance security group TCP 443 to 0.0.0.0/0 and rely on obscurity — Incorrect. Public 443 on instances bypasses the ALB as the controlled entry point.
Allow inbound TCP 443 on the instance security group only from the ALB security group — Correct. Referencing the ALB security group limits app-tier ingress to the load balancer path.
Disable all security groups and use only a wide-open network ACL allow-all rule — Incorrect. NACLs are stateless subnet guards; they do not replace instance-level least privilege.
Publish each instance with a public Elastic IP and no load balancer — Incorrect. Public instance EIPs expand attack surface and drop centralized TLS entry.


## q-saa-chapter-32 (ch03 · objective 3.4)

**Prompt:** A three-tier application needs separate public ingress and private application subnets and must survive an Availability Zone impairment. Which VPC layout meets the requirement?

- A. One public subnet in a single AZ holding every tier, including databases
- B. Private subnets only, with no path for a load balancer or controlled ingress
- C. Public and private subnets in at least two AZs, with the load balancer spanning the public subnets and app tiers in private subnets **← correct**
- D. A single private subnet in one AZ with an internet gateway attached directly to every private instance

**Explanation:**

One public subnet in a single AZ holding every tier, including databases — Incorrect. One AZ is a single point of failure and co-locating data tiers publicly is poor isolation.
Private subnets only, with no path for a load balancer or controlled ingress — Incorrect. Public-facing apps still need a designed ingress path such as public subnets for the load balancer.
Public and private subnets in at least two AZs, with the load balancer spanning the public subnets and app tiers in private subnets — Correct. Multi-AZ public/private tiering is the standard HA VPC pattern.
A single private subnet in one AZ with an internet gateway attached directly to every private instance — Incorrect. IGW routes on private-only hosts and single-AZ design break isolation and resilience.

