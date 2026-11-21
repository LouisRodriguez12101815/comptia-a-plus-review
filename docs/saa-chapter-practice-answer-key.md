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

- A. One larger instance with termination protection
- B. A launch template the team launches by hand
- C. An Auto Scaling group with CPU and health checks **← correct**
- D. An Auto Scaling group held at one fixed desired capacity

**Explanation:**

One larger instance with termination protection — Incorrect. One instance does not add or replace capacity horizontally when CPU rises or a host fails.
A launch template the team launches by hand — Incorrect. A launch template describes an instance. Launching it by hand is not automatic replacement.
An Auto Scaling group with CPU and health checks — Correct. The group scales on CPU and the health checks replace instances that fail.
An Auto Scaling group held at one fixed desired capacity — Incorrect. A fixed desired capacity does not add instances when CPU rises.


## q-saa-chapter-04 (ch02 · objective 2.2)

**Prompt:** A stateful web tier must remain available if an Availability Zone fails. Which design meets this?

- A. Instances in two subnets of one Availability Zone behind a load balancer
- B. An Auto Scaling group in one Availability Zone with a minimum of two instances
- C. Health checks that keep sending traffic to targets in the failed zone
- D. Instances in two Availability Zones behind a load balancer **← correct**

**Explanation:**

Instances in two subnets of one Availability Zone behind a load balancer — Incorrect. Two subnets in one zone still fail together when that zone fails.
An Auto Scaling group in one Availability Zone with a minimum of two instances — Incorrect. Two instances in one zone do not give the tier a place to run when that zone fails.
Health checks that keep sending traffic to targets in the failed zone — Incorrect. Health checks that keep a failed zone in rotation send users to targets that are gone.
Instances in two Availability Zones behind a load balancer — Correct. Instances in two zones behind a load balancer keep the tier up when one zone fails.


## q-saa-chapter-05 (ch03 · objective 1.2)

**Prompt:** App instances in private subnets must pull patches from the internet without accepting inbound internet connections. Which pattern is standard?

- A. A NAT gateway in a public subnet, with private default routes **← correct**
- B. An internet gateway as the default route for the private subnets
- C. Internet-facing addresses on the application instances themselves
- D. An IPv6 egress internet gateway for this IPv4 patch traffic

**Explanation:**

A NAT gateway in a public subnet, with private default routes — Correct. A NAT gateway in a public subnet lets the private instances open outbound connections, and unsolicited inbound internet connections stop at the NAT.
An internet gateway as the default route for the private subnets — Incorrect. An internet gateway as the private subnet's default route is the path that expects public addressing, not a private outbound-only path.
Internet-facing addresses on the application instances themselves — Incorrect. Public addresses on the app instances expose them to inbound internet connections.
An IPv6 egress internet gateway for this IPv4 patch traffic — Incorrect. An egress-only internet gateway is for IPv6. It is not the IPv4 path for these patch downloads.


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

**Prompt:** RDS needs automatic failover to a standby in another Availability Zone, without promoting a replica or restoring a snapshot by hand. Which feature provides this?

- A. RDS read replica
- B. RDS backup and restore
- C. RDS cross-Region read replica
- D. RDS Multi-AZ deployment **← correct**

**Explanation:**

RDS read replica — Incorrect. A read replica serves reads. It is not the synchronous standby that fails over for the writer.
RDS backup and restore — Incorrect. Backup and restore recovers from a snapshot. It is not automatic failover to a standby.
RDS cross-Region read replica — Incorrect. A cross-Region replica is a copy in another Region, not the standby in another Availability Zone.
RDS Multi-AZ deployment — Correct. Multi-AZ keeps a standby in another Availability Zone and fails over to it.


## q-saa-chapter-09 (ch05 · objective 1.1)

**Prompt:** EC2 workers must read one DynamoDB table without embedding static access keys. What is the correct credential pattern?

- A. An instance profile role limited to that one DynamoDB resource **← correct**
- B. IAM user access keys in the instance user data
- C. An instance profile role limited to a different DynamoDB table
- D. A resource-based policy that lets the instance role scan every table

**Explanation:**

An instance profile role limited to that one DynamoDB resource — Correct. The instance profile hands the workers short-lived credentials, scoped to the table they read.
IAM user access keys in the instance user data — Incorrect. Access keys in user data are static credentials on the instance, which is the pattern to avoid.
An instance profile role limited to a different DynamoDB table — Incorrect. A role for a different table does not grant the read this table needs.
A resource-based policy that lets the instance role scan every table — Incorrect. A policy that allows a scan of every table is wider than the one table these workers read.


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

- A. One EBS volume attached to a single instance as the archive
- B. Amazon S3 kept in Standard, without a lifecycle rule for colder objects
- C. Amazon S3 with lifecycle rules toward colder classes **← correct**
- D. S3 Glacier Deep Archive as the landing class for objects that are still read often

**Explanation:**

One EBS volume attached to a single instance as the archive — Incorrect. One EBS volume is a single attach point. It is not the durable HTTP archive with lifecycle movement.
Amazon S3 kept in Standard, without a lifecycle rule for colder objects — Incorrect. S3 Standard is durable HTTP storage. Without a lifecycle rule, cold objects stay on the frequent-access class.
Amazon S3 with lifecycle rules toward colder classes — Correct. S3 is the durable HTTP store, and lifecycle rules move objects from frequent access toward colder classes.
S3 Glacier Deep Archive as the landing class for objects that are still read often — Incorrect. Deep Archive is a cold landing zone. Objects that are still read often pay a retrieval penalty there.


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
- B. Simple routing with one record for the primary endpoint
- C. Weighted routing with health checks and equal weights
- D. Geoproximity routing with a failover bias toward one Region

**Explanation:**

Failover routing with health checks — Correct. Failover routing sends traffic to the primary and moves it to the secondary when health checks fail.
Simple routing with one record for the primary endpoint — Incorrect. Simple routing returns the one record. It does not switch to a secondary on a failed health check.
Weighted routing with health checks and equal weights — Incorrect. Health checks on weighted records can drop a bad endpoint. Equal weights still split traffic instead of active-passive failover.
Geoproximity routing with a failover bias toward one Region — Incorrect. A geoproximity bias shifts traffic by location. It is not active-passive failover on health.


## q-saa-chapter-14 (ch07 · objective 3.4)

**Prompt:** A global audience needs latency-based DNS answers to the nearest healthy regional API. Which Route 53 approach fits?

- A. Geolocation by country across the regional endpoints
- B. Latency routing with health checks on the regional endpoints **← correct**
- C. Geoproximity routing with a bias around one Region
- D. Weighted routing with health checks and equal weights

**Explanation:**

Geolocation by country across the regional endpoints — Incorrect. Geolocation answers from the record for the user's country, not from the lowest measured latency.
Latency routing with health checks on the regional endpoints — Correct. Latency routing answers from the regional endpoint with the lowest latency, and health checks drop an unhealthy endpoint.
Geoproximity routing with a bias around one Region — Incorrect. Geoproximity uses a bias around a location. It is not the latency measurement between the user and the Region.
Weighted routing with health checks and equal weights — Incorrect. Weights split traffic by the numbers you set. They do not pick the lowest-latency Region.


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

- A. A cache policy with a zero TTL, so each viewer still fetches from the origin
- B. CloudFront removing the S3 lifecycle rules
- C. A price class that pins every request to the origin Region
- D. Edge caches serving repeat viewers and sparing the origin **← correct**

**Explanation:**

A cache policy with a zero TTL, so each viewer still fetches from the origin — Incorrect. A zero TTL does not keep a copy, so the origin still serves every download.
CloudFront removing the S3 lifecycle rules — Incorrect. Lifecycle rules decide storage class. Removing them does not stop repeat downloads from the origin.
A price class that pins every request to the origin Region — Incorrect. A price class limits locations. It does not serve a cached copy in place of the origin.
Edge caches serving repeat viewers and sparing the origin — Correct. Edge caches answer repeat downloads, so those requests do not all go back to the origin.


## q-saa-chapter-17 (ch09 · objective 2.1)

**Prompt:** Order intake must keep accepting requests when fulfillment workers are slow or briefly unavailable. Which queue should sit between the API and the workers?

- A. Amazon SQS **← correct**
- B. Amazon SNS
- C. Amazon EventBridge
- D. Amazon Kinesis Data Streams

**Explanation:**

Amazon SQS — Correct. SQS holds each order until a worker receives it, so a slow worker does not stop intake.
Amazon SNS — Incorrect. SNS pushes a message to subscribers. It does not keep a backlog for a worker that is briefly down.
Amazon EventBridge — Incorrect. EventBridge routes events. It is not the queue that stores work until a consumer is ready.
Amazon Kinesis Data Streams — Incorrect. Kinesis retains a stream of records. The order intake here is a job queue, which is SQS.


## q-saa-chapter-18 (ch09 · objective 3.5)

**Prompt:** A new application needs a multi-step workflow with retries, branching, and visible state across Lambda tasks. Which service is purpose-built for that?

- A. Amazon EventBridge
- B. AWS Step Functions **← correct**
- C. AWS Lambda destinations
- D. Amazon SWF

**Explanation:**

Amazon EventBridge — Incorrect. EventBridge routes events to targets. It does not run a multi-step state machine with branching.
AWS Step Functions — Correct. Step Functions runs the steps, retries them, and keeps a visible state for the workflow.
AWS Lambda destinations — Incorrect. Lambda destinations hand one result to another target. They are not the workflow's state machine.
Amazon SWF — Incorrect. SWF is an older workflow service. The managed state machine for these Lambda tasks is Step Functions.


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
- B. Application Load Balancer
- C. Gateway Load Balancer
- D. Classic Load Balancer

**Explanation:**

Network Load Balancer — Correct. A Network Load Balancer is built for high-rate TCP and can preserve the client source address.
Application Load Balancer — Incorrect. An Application Load Balancer is for HTTP and HTTPS. It is not the low-latency TCP balancer.
Gateway Load Balancer — Incorrect. A Gateway Load Balancer sends traffic through appliances. It is not the application's TCP load balancer.
Classic Load Balancer — Incorrect. A Classic Load Balancer is the legacy option. It is not the current choice for this TCP profile.


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

- A. An SCP that denies the actions in the break-glass account as well
- B. A Config rule that reports a disabled security service after the change
- C. A permissions boundary used as the account control in each member account
- D. Service control policies for AWS Organizations **← correct**

**Explanation:**

An SCP that denies the actions in the break-glass account as well — Incorrect. An SCP that also binds the break-glass account removes the exception the security team kept.
A Config rule that reports a disabled security service after the change — Incorrect. Config can report the change. It does not block leaving the organization or disabling the service.
A permissions boundary used as the account control in each member account — Incorrect. A permissions boundary in the member account can be changed by an administrator of that account.
Service control policies for AWS Organizations — Correct. Service control policies can deny leaving the organization and disabling security services, with the break-glass account left out.


## q-saa-chapter-25 (ch13 · objective 4.2)

**Prompt:** Compute Optimizer reports an EC2 instance is consistently over-provisioned on CPU and memory. What is the cost-aware next step?

- A. Rightsize the instance after checking the performance need **← correct**
- B. Double the instance size immediately
- C. Leave the recommendation unused
- D. Move the workload to a memory-optimized family before checking the CPU finding

**Explanation:**

Rightsize the instance after checking the performance need — Correct. Compute Optimizer is a candidate. Confirm the performance need, then move to the smaller size it supports.
Double the instance size immediately — Incorrect. A larger size raises cost. The finding says the instance is already bigger than the CPU and memory need.
Leave the recommendation unused — Incorrect. Leaving the finding unused keeps paying for the spare CPU and memory.
Move the workload to a memory-optimized family before checking the CPU finding — Incorrect. A memory-optimized family answers a memory bottleneck. This finding is spare CPU and memory, not a need for more memory.


## q-saa-chapter-26 (ch13 · objective 4.4)

**Prompt:** A cost review finds unattached Elastic IPs and idle load balancers in a non-production account. What should operators do?

- A. Treat the idle addresses and load balancers as covered by the account support plan
- B. Release unused Elastic IPs and delete idle load balancers **← correct**
- C. Allocate additional Elastic IPs now for a project that has no running workload
- D. Move the unattached addresses onto a NAT gateway that no route uses

**Explanation:**

Treat the idle addresses and load balancers as covered by the account support plan — Incorrect. Support-plan price does not include idle Elastic IPs and idle load balancers.
Release unused Elastic IPs and delete idle load balancers — Correct. Releasing unused Elastic IPs and deleting idle load balancers removes those charges.
Allocate additional Elastic IPs now for a project that has no running workload — Incorrect. More addresses for a project that is not running add addresses the review is already trying to remove.
Move the unattached addresses onto a NAT gateway that no route uses — Incorrect. An address attached to a NAT gateway with no route is still unused.


## q-saa-chapter-27 (ch01 · objective 1.1)

**Prompt:** A growing company wants one workforce identity plane across many AWS accounts, with temporary credentials and centralized permission assignment. Which baseline fits best?

- A. IAM users with long-term keys issued as the identity in every member account
- B. One IAM user password shared as the identity across the accounts
- C. IAM Identity Center permission sets for the accounts **← correct**
- D. Permission sets created separately in each account, without an organization assignment

**Explanation:**

IAM users with long-term keys issued as the identity in every member account — Incorrect. Long-term keys in every account are the opposite of one workforce identity with temporary credentials.
One IAM user password shared as the identity across the accounts — Incorrect. A shared password is one secret for many people, not an assigned permission set per person.
IAM Identity Center permission sets for the accounts — Correct. IAM Identity Center assigns permission sets across the accounts and vends temporary credentials.
Permission sets created separately in each account, without an organization assignment — Incorrect. Permission sets that are rebuilt by hand in each account are not the centralized assignment.


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

- A. io2 volumes with the IOPS setting raised and throughput left at its default
- B. st1 volumes, picked for the throughput in the volume name
- C. gp2 volumes, where throughput stays tied to the volume size
- D. gp3 volumes sized for capacity, with throughput set to demand **← correct**

**Explanation:**

io2 volumes with the IOPS setting raised and throughput left at its default — Incorrect. io2 is the high-IOPS volume. This workload wants a baseline SSD with throughput set apart from size, not extreme IOPS.
st1 volumes, picked for the throughput in the volume name — Incorrect. st1 is a throughput-optimized hard disk. It is a poor fit for an SSD baseline that is not a disk archive.
gp2 volumes, where throughput stays tied to the volume size — Incorrect. gp2 throughput follows the size of the volume. You do not set throughput on its own.
gp3 volumes sized for capacity, with throughput set to demand — Correct. gp3 is the SSD baseline, and its throughput can be set separately from the volume size.


## q-saa-chapter-30 (ch02 · objective 4.2)

**Prompt:** A stateless image-processing fleet can tolerate interruptions and already runs behind an Auto Scaling group. Leadership wants lower compute cost than steady On-Demand for the burst workers. Which approach fits?

- A. A Compute Savings Plan that covers the On-Demand fallback and not the burst
- B. One On-Demand instance sized for the peak, with Auto Scaling turned off
- C. Spot capacity for the burst tasks, with an On-Demand fallback **← correct**
- D. Spot capacity for the burst tasks that stops when the Spot pool is empty

**Explanation:**

A Compute Savings Plan that covers the On-Demand fallback and not the burst — Incorrect. A Savings Plan on the fallback does not lower the price of the burst tasks that can be interrupted.
One On-Demand instance sized for the peak, with Auto Scaling turned off — Incorrect. One large On-Demand instance priced for the peak is the steady cost the team is trying to beat.
Spot capacity for the burst tasks, with an On-Demand fallback — Correct. Spot is the cheaper burst capacity, and an On-Demand fallback remains when Spot is not available.
Spot capacity for the burst tasks that stops when the Spot pool is empty — Incorrect. Spot with no fallback stops the burst work when the pool is empty.


## q-saa-chapter-31 (ch03 · objective 1.2)

**Prompt:** Web instances must accept HTTPS only from an Application Load Balancer security group, not from the public internet. Which control is the standard least-privilege pattern?

- A. Allow TCP 443 on the instance security group from the VPC CIDR
- B. Allow TCP 443 on the instance security group from the ALB security group **← correct**
- C. Allow TCP 443 on the subnet network ACL from the ALB subnet CIDR
- D. Allow TCP 443 on the instance security group from the ALB subnet CIDR

**Explanation:**

Allow TCP 443 on the instance security group from the VPC CIDR — Incorrect. The VPC CIDR includes more than the load balancer, so other hosts in the VPC could reach the instances.
Allow TCP 443 on the instance security group from the ALB security group — Correct. The instance rule references the load balancer's security group, so the path is the balancer and not the open internet.
Allow TCP 443 on the subnet network ACL from the ALB subnet CIDR — Incorrect. A network ACL uses CIDR ranges. It cannot name a security group as its source.
Allow TCP 443 on the instance security group from the ALB subnet CIDR — Incorrect. The ALB subnet CIDR allows any host in that subnet, which is wider than the balancer's security group.


## q-saa-chapter-32 (ch03 · objective 3.4)

**Prompt:** A three-tier application needs separate public ingress and private application subnets and must survive an Availability Zone impairment. Which VPC layout meets the requirement?

- A. One public subnet and one private subnet that share a single zone
- B. Private subnets in two AZs for the load balancer and the applications
- C. Public and private subnets in two AZs, with the apps kept private **← correct**
- D. Public subnets in two AZs, with the database in those public subnets

**Explanation:**

One public subnet and one private subnet that share a single zone — Incorrect. The subnet split is right, but both subnets are in one zone, so a zone impairment takes the whole application out.
Private subnets in two AZs for the load balancer and the applications — Incorrect. Private subnets in two zones survive a zone impairment, but a public load balancer has no public subnet to sit in.
Public and private subnets in two AZs, with the apps kept private — Correct. Public subnets in two zones hold the load balancer, and the application stays in private subnets in those zones.
Public subnets in two AZs, with the database in those public subnets — Incorrect. Two zones remove the single-zone failure, but the database is in the public subnets with the web tier.

