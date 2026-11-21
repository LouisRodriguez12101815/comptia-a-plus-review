#!/usr/bin/env python3
"""Emit content/saa-service-facts.json. Not part of the site runtime."""
import json
from pathlib import Path

EBS = "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-volume-types.html"
LAMBDA = "https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html"
GLACIER = "https://docs.aws.amazon.com/AmazonS3/latest/userguide/restoring-objects-retrieval-options.html"
EC2_NAMES = "https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-type-names.html"
S3_CLASSES = "https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html"
EFS_FEATURES = "https://docs.aws.amazon.com/efs/latest/ug/features.html"
RDS_TYPES = "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.Types.html"
DDB = "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/capacity-mode.html"
SQS_TYPES = "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-types.html"
ELB = "https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html"
GATEWAY = "https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html"
VPC = "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html"
QUICK = "https://docs.aws.amazon.com/quick/latest/userguide/what-is.html"

records = []

def add(**kwargs):
    records.append(kwargs)

def core(id, name, category, scope, tasks, docs, definition, uses, not_for, claim, claim_ok, correction="", acronym="", expansion="", scope_note="", classes=None, numbers=None, costs=None, aliases=None):
    row = {
        "id": id, "name": name, "category": category, "tier": "core", "scope": scope,
        "tasks": tasks, "docsUrl": docs, "definition": definition, "useWhen": uses,
        "notFor": not_for, "lightning": {"claim": claim, "answer": claim_ok},
    }
    if correction:
        row["lightning"]["correction"] = correction
    if acronym:
        row["acronym"] = acronym
        row["expansion"] = expansion
    if scope_note:
        row["scopeNote"] = scope_note
    if classes:
        row["classes"] = classes
    if numbers:
        row["numbers"] = numbers
    if costs:
        row["costs"] = costs
    if aliases:
        row["aliases"] = aliases
    add(**row)

def peripheral(id, name, category, scope, task, docs, definition, use, acronym="", expansion=""):
    row = {
        "id": id, "name": name, "category": category, "tier": "peripheral", "scope": scope,
        "tasks": [task], "docsUrl": docs, "definition": definition, "useWhen": [use],
    }
    if acronym:
        row["acronym"] = acronym
        row["expansion"] = expansion
    add(**row)

def klass(name, purpose, task, docs):
    return {"name": name, "purpose": purpose, "task": task, "docsUrl": docs}

# --- core: the approved high-yield set ---
core("iam", "IAM", "Security, Identity, and Compliance", "global", ["1.1", "1.2"],
     "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html",
     "IAM is the identity service for users, roles, and policies in an AWS account.",
     ["Choose IAM when an application needs a role whose permissions you write in a policy.",
      "Choose IAM when you need to grant a person or workload access inside one account."],
     "you want a company-wide sign-in directory across many accounts",
     "IAM users and roles are created separately in each Region.", False,
     "IAM is global. The same users, roles, and policies apply in every Region.",
     "IAM", "AWS Identity and Access Management")

core("identity-center", "AWS IAM Identity Center", "Security, Identity, and Compliance", "global", ["1.1", "1.2"],
     "https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html",
     "IAM Identity Center is the workforce sign-in service for multiple AWS accounts.",
     ["Choose IAM Identity Center when people need one sign-in to a set of accounts.",
      "Choose IAM Identity Center when access should follow group membership rather than a new IAM user in every account."],
     "a single application needs its own IAM role and no workforce directory",
     "IAM Identity Center replaced AWS Single Sign-On as the current service name.", True)

core("organizations", "AWS Organizations", "Management and Governance", "global", ["1.1", "1.2"],
     "https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html",
     "AWS Organizations groups accounts and can apply a service control policy to them.",
     ["Choose AWS Organizations when a company needs one bill and a policy boundary across accounts.",
      "Choose AWS Organizations when an account should be kept from turning on a service, even if its IAM admin allows it."],
     "you only need a permission for one role inside one account",
     "A service control policy can grant a permission that IAM denied.", False,
     "A service control policy only filters permissions the account already has. It does not grant new ones.")

core("kms", "AWS KMS", "Security, Identity, and Compliance", "Regional", ["1.3", "1.1", "4.1"],
     "https://docs.aws.amazon.com/kms/latest/developerguide/overview.html",
     "AWS KMS creates and controls the keys other AWS services use for encryption.",
     ["Choose AWS KMS when S3, EBS, or RDS should encrypt data with a key you can disable.",
      "Choose AWS KMS when the application must call encrypt or decrypt without running its own key server.",
      "Choose AWS KMS when the encryption key should stay in the Region with the data."],
     "you need a dedicated hardware security module that you administer yourself",
     "A KMS key stored in one Region automatically decrypts data in every Region.", False,
     "A KMS key is Regional unless you are using a multi-Region key that you created for that purpose.",
     "KMS", "AWS Key Management Service")

core("secrets", "AWS Secrets Manager", "Security, Identity, and Compliance", "Regional", ["1.1", "1.2", "1.3"],
     "https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html",
     "Secrets Manager stores a secret and can rotate it for a supported database.",
     ["Choose Secrets Manager when an application should read a database password at runtime.",
      "Choose Secrets Manager when the password should rotate without a new deploy.",
      "Choose Secrets Manager when the secret must not be baked into the AMI or the task definition."],
     "you need to encrypt an S3 object rather than store a password",
     "Secrets Manager is the service that encrypts the object bytes in an S3 bucket.", False,
     "S3 encryption uses a key, usually from KMS. Secrets Manager holds the credential, not the object.")

core("acm", "AWS Certificate Manager", "Security, Identity, and Compliance", "Regional", ["1.2", "3.4"],
     "https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html",
     "AWS Certificate Manager requests and renews TLS certificates for supported AWS services.",
     ["Choose AWS Certificate Manager when an Application Load Balancer or CloudFront distribution needs a public TLS certificate.",
      "Choose AWS Certificate Manager when you want AWS to renew that certificate."],
     "you need to terminate TLS on an EC2 instance that is not using an ACM integration",
     "ACM public certificates can be exported and installed on any EC2 instance.", False,
     "A public ACM certificate is used with integrated services such as Elastic Load Balancing and CloudFront. It is not a general exported certificate for an arbitrary server.",
     "ACM", "AWS Certificate Manager")

core("waf", "AWS WAF", "Security, Identity, and Compliance", "Regional", ["1.2", "3.4"],
     "https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html",
     "AWS WAF is a web application firewall that filters HTTP requests to a supported resource.",
     ["Choose AWS WAF when you need to allow or block HTTP requests by IP, header, or a managed rule.",
      "Choose AWS WAF when the filter belongs on CloudFront or on an Application Load Balancer."],
     "you need to block a port or an IP at the subnet, with no HTTP inspection",
     "AWS WAF replaces a security group for every protocol.", False,
     "AWS WAF inspects web requests. A security group filters packets by protocol and port.",
     "WAF", "web application firewall",
     "A web ACL attached to an Application Load Balancer is Regional. A web ACL attached to CloudFront is on the global edge.")

core("shield", "AWS Shield", "Security, Identity, and Compliance", "global", ["1.2", "3.4"],
     "https://docs.aws.amazon.com/waf/latest/developerguide/shield-chapter.html",
     "AWS Shield protects against network and transport-layer denial-of-service attacks.",
     ["Choose Shield Standard when a public CloudFront distribution or load balancer needs the baseline DDoS protection.",
      "Choose Shield Advanced when the application needs the paid DDoS response features on a supported resource."],
     "you need to block a specific HTTP header or SQL pattern",
     "Shield inspects the HTTP body and blocks SQL injection.", False,
     "HTTP request rules belong to AWS WAF. Shield is the DDoS protection.")

core("guardduty", "Amazon GuardDuty", "Security, Identity, and Compliance", "Regional", ["1.2", "1.1", "1.3"],
     "https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html",
     "GuardDuty watches account and network activity and reports findings.",
     ["Choose GuardDuty when you want findings about suspicious API calls or compromised credentials.",
      "Choose GuardDuty when the detection should run without an agent on every instance.",
      "Choose GuardDuty when a finding should point at the resource that was touched."],
     "you need a firewall that blocks the request before it arrives",
     "GuardDuty blocks the packet that triggered the finding.", False,
     "GuardDuty reports findings. Blocking the request is a separate control, such as a security group, WAF, or a response you build.")

core("inspector", "Amazon Inspector", "Security, Identity, and Compliance", "Regional", ["1.2", "1.3"],
     "https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html",
     "Amazon Inspector scans workloads for software vulnerabilities and unintended network exposure.",
     ["Choose Amazon Inspector when EC2, a container image, or Lambda should be scanned for known vulnerabilities.",
      "Choose Amazon Inspector when you need a finding about a package, not a person browsing the console."],
     "you need to store and rotate the database password",
     "Inspector rotates credentials when it finds a vulnerability.", False,
     "Inspector reports the vulnerability. Rotation belongs to Secrets Manager or the application.")

core("macie", "Amazon Macie", "Security, Identity, and Compliance", "Regional", ["1.3", "1.1", "4.1"],
     "https://docs.aws.amazon.com/macie/latest/user/what-is-macie.html",
     "Macie discovers sensitive data in Amazon S3 and reports where it sits.",
     ["Choose Macie when you need to find credentials or personal data stored in S3.",
      "Choose Macie when the question is which bucket holds sensitive objects.",
      "Choose Macie when the finding should drive a lifecycle or access change, not a new database."],
     "you need to block an HTTP request at the edge",
     "Macie encrypts every S3 object it scans.", False,
     "Macie classifies data. Encryption is a bucket or key setting, not the scan itself.")

core("cognito", "Amazon Cognito", "Security, Identity, and Compliance", "Regional", ["1.1", "1.2"],
     "https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html",
     "Amazon Cognito is the user directory and token issuer for application sign-in.",
     ["Choose Amazon Cognito when an app needs sign-up, sign-in, and tokens for its own users.",
      "Choose Amazon Cognito when those users are not IAM users in the AWS account."],
     "employees need one sign-in to many AWS accounts",
     "Cognito user-pool users are IAM users in the account.", False,
     "A user pool is an application directory. IAM users are account principals. Workforce access to accounts is IAM Identity Center.")

core("network-firewall", "AWS Network Firewall", "Security, Identity, and Compliance", "Regional", ["1.2", "3.4"],
     "https://docs.aws.amazon.com/network-firewall/latest/developerguide/what-is-aws-network-firewall.html",
     "AWS Network Firewall inspects VPC traffic with stateful rules and can filter by domain.",
     ["Choose AWS Network Firewall when traffic between subnets or to the internet needs inspection beyond a security group.",
      "Choose AWS Network Firewall when the rule should match a domain or a Suricata-style signature."],
     "you only need to allow TCP 443 from one CIDR to one instance",
     "Network Firewall is a cheaper replacement for every security group.", False,
     "A security group is still the instance-level allow list. Network Firewall is the VPC inspection point.")

core("vpc", "Amazon VPC", "Networking and Content Delivery", "Regional", ["3.4", "1.2", "4.4"],
     "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html",
     "Amazon VPC is the virtual network where you place subnets, route tables, and gateways.",
     ["Choose a VPC when workloads need private IP addresses and subnet isolation.",
      "Choose a security group or network ACL inside the VPC when the question is who can talk to an instance.",
      "Choose a gateway endpoint in the VPC when private subnets should reach S3 or DynamoDB without a NAT gateway."],
     "you need a public anycast network in front of an HTTP API",
     "There is an additional charge for using a VPC itself.", False,
     "The VPC page says there is no additional charge for using a VPC. NAT gateways are one of the VPC components that are charged.",
     "VPC", "Amazon Virtual Private Cloud",
     costs=[{
         "id": "nat-vs-gateway",
         "prompt": "Private subnets must reach Amazon S3 in the same Region. Which option has no additional charge?",
         "answer": "Gateway VPC endpoint",
         "detail": "The gateway-endpoints page says there is no additional charge for using gateway endpoints. The VPC page lists NAT gateways among the components that are charged. Relative, not a price.",
         "task": "4.4",
         "docsUrl": GATEWAY,
     }])

core("route53", "Amazon Route 53", "Networking and Content Delivery", "global", ["2.2", "3.4", "4.4"],
     "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html",
     "Route 53 is the DNS service, including health checks and routing policies.",
     ["Choose Route 53 when a name should resolve to a healthy endpoint.",
      "Choose a failover or latency routing policy when DNS should prefer a healthy or nearer Region.",
      "Choose Route 53 alias records when the target is a supported AWS resource such as a load balancer or CloudFront distribution."],
     "you need to distribute HTTP connections across instances in one subnet",
     "Route 53 replaces an Application Load Balancer for instance-level HTTP balancing.", False,
     "Route 53 answers DNS. An Application Load Balancer distributes the HTTP connections.")

core("cloudfront", "Amazon CloudFront", "Networking and Content Delivery", "global", ["3.4", "4.4", "2.2"],
     "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html",
     "CloudFront caches content at edge locations and can be the public front for an origin.",
     ["Choose CloudFront when viewers far from the origin should get a cached copy.",
      "Choose CloudFront when you want the public hostname on the edge and the bucket or load balancer private to that origin.",
      "Choose CloudFront when a Region failure should be hidden by a second origin you already configured."],
     "you need a static anycast IP for a non-HTTP game server",
     "CloudFront is the anycast front door for raw UDP game traffic.", False,
     "CloudFront serves HTTP and related content. AWS Global Accelerator is the anycast option for TCP and UDP.")

core("global-accelerator", "AWS Global Accelerator", "Networking and Content Delivery", "global", ["3.4", "4.4", "2.2"],
     "https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html",
     "Global Accelerator gives static anycast IP addresses and routes TCP or UDP to Regional endpoints.",
     ["Choose Global Accelerator when clients need static IP addresses and a TCP or UDP path onto the AWS network.",
      "Choose Global Accelerator when the same IP pair should fail over to a healthy Regional endpoint.",
      "Choose Global Accelerator rather than CloudFront when the traffic is not cacheable HTTP."],
     "viewers should download the same image from a cache close to them",
     "Global Accelerator caches HTTP objects at the edge the way CloudFront does.", False,
     "Global Accelerator routes the connection. It is not the content cache.")

core("elb", "Elastic Load Balancing", "Networking and Content Delivery", "Regional", ["3.4", "2.1", "4.4"],
     ELB,
     "Elastic Load Balancing distributes incoming traffic across targets such as EC2 instances.",
     ["Choose an Application Load Balancer when the decision uses the HTTP host, path, or header.",
      "Choose a Network Load Balancer when the listener is TCP or UDP and you need a static address.",
      "Choose a Gateway Load Balancer when traffic must pass through a fleet of virtual appliances."],
     "you need DNS failover between two Regions and no load balancer",
     "Elastic Load Balancing is a global DNS service.", False,
     "A load balancer is Regional. Cross-Region DNS failover is Route 53.",
     classes=[
         klass("Application Load Balancer", "HTTP and HTTPS listeners that can route on host, path, or header.", "3.4", ELB),
         klass("Network Load Balancer", "TCP and UDP listeners, including a static IP per Availability Zone.", "3.4", ELB),
         klass("Gateway Load Balancer", "Sends traffic through a fleet of virtual network appliances.", "3.4", ELB),
     ])

core("direct-connect", "AWS Direct Connect", "Networking and Content Delivery", "Regional", ["3.4", "4.4", "2.2"],
     "https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html",
     "Direct Connect is a private network connection from your premises to AWS.",
     ["Choose Direct Connect when office or data-center traffic should reach a VPC on a dedicated link.",
      "Choose Direct Connect when the path should not depend on the public internet.",
      "Choose a VPN as well when you still need an encrypted tunnel or a faster-to-deploy backup path."],
     "you need a cached HTTP copy close to viewers on the internet",
     "Direct Connect caches web content at edge locations.", False,
     "Direct Connect is the private link. CloudFront is the edge cache.")

core("site-to-site-vpn", "AWS Site-to-Site VPN", "Networking and Content Delivery", "Regional", ["3.4", "4.4", "1.2"],
     "https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html",
     "Site-to-Site VPN is an IPsec tunnel between a customer gateway and a VPC or transit gateway.",
     ["Choose Site-to-Site VPN when a site needs an encrypted tunnel to a VPC over the internet.",
      "Choose Site-to-Site VPN when you cannot wait for a Direct Connect circuit.",
      "Choose Site-to-Site VPN as the encrypted option when the question contrasts it with a Direct Connect link."],
     "the requirement is a dedicated physical circuit with no IPsec tunnel",
     "Site-to-Site VPN is a dedicated fiber circuit into the Region.", False,
     "The dedicated circuit is Direct Connect. Site-to-Site VPN is the IPsec tunnel.")

core("transit-gateway", "AWS Transit Gateway", "Networking and Content Delivery", "Regional", ["3.4", "4.4"],
     "https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html",
     "A transit gateway connects VPCs and on-premises networks through one Regional hub.",
     ["Choose a transit gateway when many VPCs should share one hub instead of a mesh of peering links.",
      "Choose a transit gateway when a VPN or Direct Connect attachment should reach several VPCs."],
     "two VPCs need one private route and nothing else will connect",
     "A transit gateway is required for every pair of VPCs.", False,
     "Two VPCs can use peering. A transit gateway is the hub when many networks connect.")

core("privatelink", "AWS PrivateLink", "Networking and Content Delivery", "Regional", ["1.2", "3.4"],
     "https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html",
     "PrivateLink exposes a service through a private endpoint inside a VPC.",
     ["Choose PrivateLink when a VPC should reach an AWS or partner service without an internet gateway.",
      "Choose an interface endpoint when the consumer should use a private IP in its own subnet."],
     "private subnets only need S3 or DynamoDB and you want no hourly endpoint charge",
     "A gateway endpoint uses PrivateLink.", False,
     "The gateway-endpoints page says gateway endpoints do not use AWS PrivateLink.")

core("ec2", "Amazon EC2", "Compute", "Regional", ["3.2", "4.2", "2.1"],
     "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html",
     "Amazon EC2 rents virtual servers. You choose the instance type and the operating system.",
     ["Choose EC2 when you must control the operating system, the instance type, or software that is not a managed runtime.",
      "Choose a purchase option on EC2 when the same instance family can be On-Demand, Spot, or a Savings Plan.",
      "Choose EC2 when the workload should survive a single process restart by running as a server you manage."],
     "the function should run only when an event arrives and you do not want a server",
     "An EC2 instance type letter is a price ranking.", False,
     "The instance-type naming page gives each series a purpose, such as compute optimized or burstable. It is not a price list.",
     "EC2", "Amazon Elastic Compute Cloud",
     classes=[
         klass(name, purpose, "3.2", EC2_NAMES) for name, purpose in [
             ("A series", "Arm-based AWS Graviton processors."),
             ("C series", "Compute optimized."),
             ("D series", "Dense storage."),
             ("F series", "FPGA."),
             ("G series", "Graphics intensive."),
             ("Hpc series", "High performance computing."),
             ("I series", "Storage optimized."),
            ("Im series", "Storage optimized. The naming page lists Im separately from I and Is."),
            ("Is series", "Storage optimized. The naming page lists Is separately from I and Im."),
             ("Inf series", "AWS Inferentia."),
             ("M series", "General purpose."),
             ("Mac series", "macOS."),
             ("P series", "GPU accelerated."),
             ("R series", "Memory optimized."),
             ("T series", "Burstable performance."),
             ("Trn series", "AWS Trainium."),
             ("U series", "High memory."),
             ("VT series", "Video transcoding."),
             ("X series", "Memory intensive."),
             ("Z series", "High memory."),
         ]
     ],
     costs=[{
         "id": "spot-vs-ondemand",
         "prompt": "A batch job can stop and restart. Which EC2 purchase option is the interruptible spare capacity, not a steady discount?",
         "answer": "Spot",
         "detail": "Spot uses spare capacity and can be interrupted. A Savings Plan is the commitment discount for steady use. This is not a dollar ranking of Spot, Savings Plans, and Reserved Instances.",
         "task": "4.2",
         "docsUrl": "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html",
     }])

core("ec2-auto-scaling", "Amazon EC2 Auto Scaling", "Compute", "Regional", ["2.1", "3.2", "4.2"],
     "https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html",
     "EC2 Auto Scaling adds and removes EC2 instances in a group to match demand or replace a failed instance.",
     ["Choose an Auto Scaling group when the number of EC2 instances should follow CPU or a queue depth.",
      "Choose an Auto Scaling group when a failed instance should be replaced with a new one from the launch template.",
      "Choose an Auto Scaling group when scale-in should drop unused instances and their cost."],
     "you need to add read replicas to a database",
     "EC2 Auto Scaling adds Aurora read replicas.", False,
     "EC2 Auto Scaling changes the EC2 group. Database replicas are a database feature.")

core("lambda", "AWS Lambda", "Serverless", "Regional", ["3.2", "4.2", "2.1"],
     "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html",
     "Lambda runs your code when an event arrives, without a server you manage.",
     ["Choose Lambda when code should run in response to an event and then stop.",
      "Choose Lambda when you would rather pay for duration and memory than for an idle instance.",
      "Choose Lambda when a queue or a bucket event should invoke a function."],
     "the process must stay running for many hours and listen on a port you choose",
     "Raising the Lambda timeout gives the function more CPU.", False,
     "The quotas page says CPU is allocated in proportion to memory. Timeout only caps how long the invocation may run.",
     numbers=[
        {"id": "timeout", "label": "Lambda function timeout maximum", "current": "1,800 seconds (30 minutes)", "changedNote": "900 seconds (15 minutes)", "docsUrl": LAMBDA, "task": "3.2"},
        {"id": "memory", "label": "Lambda function memory allocation", "current": "128 MB to 10,240 MB, in 1 MB increments", "changedNote": "a maximum of 3,008 MB", "docsUrl": LAMBDA, "task": "3.2"},
     ])

core("fargate", "AWS Fargate", "Serverless", "Regional", ["3.2", "4.2", "2.1"],
     "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html",
     "Fargate runs a container without EC2 instances for you to patch.",
     ["Choose Fargate when an ECS or EKS task should run without an EC2 capacity provider.",
      "Choose Fargate when you do not want to manage the instance that hosts the container.",
      "Choose Fargate when the task should scale by task count rather than by instance count."],
     "you need a GPU instance type or a custom kernel on the host",
     "Fargate lets you pick the EC2 instance family for the host.", False,
     "Fargate hides the instance. Choosing the instance family is EC2.")

core("ecs", "Amazon ECS", "Containers", "Regional", ["3.2", "2.1"],
     "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html",
     "Amazon ECS runs Docker containers as tasks and services.",
     ["Choose ECS when you want AWS to schedule containers and you do not need Kubernetes.",
      "Choose ECS when the service should sit behind a load balancer and replace unhealthy tasks."],
     "the platform requirement is Kubernetes",
     "ECS is the managed Kubernetes service.", False,
     "Managed Kubernetes is Amazon EKS. ECS is the AWS container scheduler.",
     "ECS", "Amazon Elastic Container Service")

core("eks", "Amazon EKS", "Containers", "Regional", ["3.2", "2.1"],
     "https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html",
     "Amazon EKS runs Kubernetes control planes so you can use Kubernetes tools.",
     ["Choose EKS when the workload is already written for Kubernetes.",
      "Choose EKS when you need Kubernetes add-ons and the kubectl workflow."],
     "you want the simplest AWS scheduler for a single container and no Kubernetes",
     "EKS is required for every container on AWS.", False,
     "Containers can run on ECS or on EC2. EKS is the Kubernetes option.",
     "EKS", "Amazon Elastic Kubernetes Service")

core("s3", "Amazon S3", "Storage", "Regional", ["3.1", "4.1", "1.3"],
     "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html",
     "Amazon S3 is object storage. You put objects in a bucket that lives in one Region.",
     ["Choose S3 when many clients need to store and fetch objects by key.",
      "Choose an S3 storage class when the access pattern is known and you want a lower-cost class for infrequent or archive data.",
      "Choose bucket policy, Block Public Access, or a KMS key when the question is who can read the objects."],
     "an application needs a POSIX file system mounted from several instances",
     "An S3 bucket is a multi-AZ file system with file locks.", False,
     "S3 is object storage. A shared file system is EFS or a matching FSx type.",
     "S3", "Amazon Simple Storage Service",
     "Bucket names are globally unique, but each bucket and its data live in one Region.",
     classes=[
        klass("S3 Standard", "Default class for frequently accessed objects.", "4.1", S3_CLASSES),
        klass("S3 Express One Zone", "High-performance class in one Availability Zone for latency-sensitive access.", "4.1", S3_CLASSES),
        klass("S3 Standard-IA", "Infrequent access that stays available for millisecond retrieval.", "4.1", S3_CLASSES),
        klass("S3 One Zone-IA", "Infrequent access stored in one Availability Zone.", "4.1", S3_CLASSES),
        klass("S3 Intelligent-Tiering", "For objects whose access pattern changes or is unknown.", "4.1", S3_CLASSES),
        klass("S3 Glacier Instant Retrieval", "Archive class that can be read immediately with GET.", "4.1", S3_CLASSES),
        klass("S3 Glacier Flexible Retrieval", "Archive class that needs a restore before you can read the object.", "4.1", S3_CLASSES),
        klass("S3 Glacier Deep Archive", "Archive class for rarely accessed objects that need a restore.", "4.1", S3_CLASSES),
     ])

core("s3-glacier", "Amazon S3 Glacier", "Storage", "Regional", ["4.1", "3.1", "2.2"],
     "https://docs.aws.amazon.com/AmazonS3/latest/userguide/glacier-storage-classes.html",
     "S3 Glacier storage classes keep archive objects. Flexible Retrieval and Deep Archive need a restore before you can read them.",
     ["Choose Glacier Flexible Retrieval when the archive can wait for an Expedited, Standard, or Bulk restore.",
      "Choose Glacier Instant Retrieval when the archive must still be read immediately.",
      "Choose a restore tier only after the object is already in Flexible Retrieval or Deep Archive."],
     "the application reads the object on every request and cannot wait for a restore",
     "Glacier Flexible Retrieval serves GetObject immediately, with no restore.", False,
     "Instant Retrieval is the immediate class. Flexible Retrieval and Deep Archive need RestoreObject.",
     numbers=[{
         "id": "flex-times",
         "label": "Glacier Flexible Retrieval typical restore times",
         "current": "Expedited typically 1–5 minutes for objects under 250 MB; Standard typically 3–5 hours; Bulk typically 5–12 hours",
         "docsUrl": GLACIER,
         "task": "4.1",
     }],
     costs=[{
         "id": "retrieval-order",
         "prompt": "Order Glacier Flexible Retrieval options from faster retrieval toward the slower, lower-cost option.",
         "answer": "Expedited, then Standard, then Bulk",
         "detail": "The retrieval-options page lists Expedited, Standard, and Bulk by retrieval speed. Expedited is the premium option. Bulk is the lowest-cost option, and Bulk retrievals are free for objects in S3 Glacier Flexible Retrieval. Relative, not a clock time you should invent.",
         "task": "4.1",
         "docsUrl": GLACIER,
     }])

core("ebs", "Amazon EBS", "Storage", "AZ", ["3.1", "4.1", "2.2"],
     "https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html",
     "Amazon EBS is block storage for an EC2 instance. A volume is created in one Availability Zone.",
     ["Choose EBS when one instance needs a durable disk for a file system or a database.",
      "Choose gp3 when size, IOPS, and throughput should be set separately for a general SSD.",
      "Choose a snapshot copied to another Region when the volume itself cannot leave its Availability Zone."],
     "several instances in different Availability Zones must mount the same files",
     "An EBS volume is shared across Availability Zones like a file system.", False,
     "An EBS volume stays in one Availability Zone. Shared files across zones are EFS or a matching FSx type.",
     "EBS", "Amazon Elastic Block Store",
     "The volume is created in one Availability Zone. Snapshots are the copy you can restore elsewhere.",
     classes=[
         klass("gp3", "General Purpose SSD. Size, IOPS, and throughput are set separately.", "3.1", EBS),
         klass("io2 Block Express", "Provisioned IOPS SSD for sustained IOPS and sub-millisecond latency.", "3.1", EBS),
         klass("gp2", "Previous General Purpose SSD. Performance is tied to volume size.", "4.1", EBS),
         klass("io1", "Provisioned IOPS SSD from the previous generation on the volume-types page.", "4.1", EBS),
         klass("st1", "Throughput Optimized HDD for big data, data warehouses, and logs.", "4.1", EBS),
         klass("sc1", "Cold HDD for infrequently accessed throughput data where the lowest storage cost matters.", "4.1", EBS),
         klass("magnetic standard", "Previous-generation magnetic volume for infrequently accessed data.", "4.1", EBS),
     ],
     numbers=[
        {"id": "gp3-max", "label": "Amazon EBS gp3 maximum IOPS and throughput", "current": "80,000 IOPS and 2,000 MiB/s", "changedNote": "16,000 IOPS and 1,000 MiB/s", "docsUrl": EBS, "task": "3.1"},
        {"id": "io2-max", "label": "Amazon EBS io2 Block Express maximum IOPS and throughput", "current": "256,000 IOPS and 4,000 MiB/s", "changedNote": "64,000 IOPS", "docsUrl": EBS, "task": "3.1"},
     ])

core("efs", "Amazon EFS", "Storage", "Regional", ["3.1", "4.1", "2.2"],
     "https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html",
     "Amazon EFS is a shared file system for Linux workloads. A Regional file system stores data across Availability Zones.",
     ["Choose EFS when Linux instances in more than one Availability Zone must mount the same files.",
      "Choose EFS Standard for active files, and IA or Archive when the features page's cost-optimized classes match the access pattern.",
      "Choose a Regional file system when the loss of one Availability Zone must not lose the file system."],
     "Windows clients need an SMB share and Windows ACLs",
     "EFS is the SMB file server for Windows ACLs.", False,
     "SMB for Windows is FSx for Windows File Server. EFS is the Linux NFS file system.",
     "EFS", "Amazon Elastic File System",
     classes=[
         klass("EFS Regional", "Stores the file system across Availability Zones in the Region.", "3.1", EFS_FEATURES),
         klass("EFS One Zone", "Stores the file system in one Availability Zone. It is not resilient to the loss of that zone.", "3.1", EFS_FEATURES),
         klass("EFS Standard", "SSD class for frequently accessed files. New data is written here first.", "4.1", EFS_FEATURES),
         klass("EFS Infrequent Access", "Cost-optimized class for data accessed only a few times each quarter.", "4.1", EFS_FEATURES),
         klass("EFS Archive", "Cost-optimized class for data accessed a few times each year or less.", "4.1", EFS_FEATURES),
     ],
     costs=[{
         "id": "ia-archive",
         "prompt": "Files are read only a few times each quarter. Which EFS storage class does the features page call cost-optimized for that pattern?",
         "answer": "EFS Infrequent Access",
         "detail": "The features page calls EFS Infrequent Access cost-optimized for data accessed a few times each quarter, and EFS Archive cost-optimized for data accessed a few times a year or less. It does not call One Zone a lower price than Regional. Relative, not a price.",
         "task": "4.1",
         "docsUrl": EFS_FEATURES,
     }])

core("fsx", "Amazon FSx", "Storage", "Regional", ["3.1", "4.1"],
     "https://docs.aws.amazon.com/fsx/latest/WindowsGuide/what-is.html",
     "Amazon FSx is managed file storage. The type has to match the protocol: Windows, Lustre, ONTAP, or OpenZFS.",
     ["Choose FSx for Windows File Server when clients need SMB and Windows ACLs.",
      "Choose FSx for Lustre when a compute cluster needs a high-throughput POSIX file system."],
     "Linux instances only need a simple shared NFS file system",
     "Every shared Linux file system should be FSx for Windows File Server.", False,
     "Simple shared NFS for Linux is Amazon EFS. Windows SMB is FSx for Windows File Server.")

core("storage-gateway", "AWS Storage Gateway", "Migration and Transfer", "Regional", ["3.5", "3.1", "4.4"],
     "https://docs.aws.amazon.com/storagegateway/latest/tgw/WhatIsStorageGateway.html",
     "Storage Gateway presents cloud storage to an on-premises application as a file, volume, or tape interface.",
     ["Choose Storage Gateway when an on-premises application should keep its file or volume interface and land data in AWS.",
      "Choose File Gateway when the on-premises side should see NFS or SMB backed by S3.",
      "Choose Tape Gateway when backup software should write virtual tapes."],
     "you are shipping a device because the link cannot carry the dataset",
     "Storage Gateway is the shippable appliance for an offline migration.", False,
     "The shippable devices are the Snow Family. Storage Gateway uses the network.")

core("backup", "AWS Backup", "Storage", "Regional", ["2.2", "4.1", "1.3"],
     "https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html",
     "AWS Backup centralizes backup plans for supported services and can copy a recovery point to another Region.",
     ["Choose AWS Backup when one plan should back up several services on a schedule.",
      "Choose a backup vault policy when the recovery point must be protected from deletion.",
      "Choose a cross-Region copy when the recovery point has to leave the source Region."],
     "you need the database's own failover to another Availability Zone",
     "AWS Backup is the Multi-AZ failover for RDS.", False,
     "Multi-AZ is the database failover. AWS Backup is the recovery point.")

core("rds", "Amazon RDS", "Database", "Regional", ["3.3", "2.2", "4.3"],
     "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html",
     "Amazon RDS runs a managed relational database. You choose the engine and the instance class.",
     ["Choose RDS when the application needs MySQL, PostgreSQL, MariaDB, Oracle, or SQL Server and you do not want to run the host.",
      "Choose Multi-AZ when the database should fail over to a standby in another Availability Zone.",
      "Choose a smaller or burstable class when the instance is larger than the workload."],
     "the workload is key-value at any scale and does not need SQL joins",
     "RDS is the key-value database with single-digit-millisecond items.", False,
     "That access pattern is DynamoDB. RDS is the relational engine.",
     "RDS", "Amazon Relational Database Service",
     classes=[
         klass("db.m", "General-purpose instance classes.", "4.3", RDS_TYPES),
         klass("db.r", "Memory-optimized instance classes for memory-intensive databases.", "4.3", RDS_TYPES),
         klass("db.c", "Compute-optimized instance classes.", "4.3", RDS_TYPES),
         klass("db.t", "Burstable-performance instance classes.", "4.3", RDS_TYPES),
         klass("db.x", "Memory-intensive instance classes on the class-types page.", "4.3", RDS_TYPES),
         klass("db.z", "Memory-intensive instance classes, including the Z family named on the class-types page.", "4.3", RDS_TYPES),
     ])

core("aurora", "Amazon Aurora", "Database", "Regional", ["3.3", "2.2", "4.3"],
     "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html",
     "Aurora is the MySQL- and PostgreSQL-compatible relational database with a shared storage layer across Availability Zones.",
     ["Choose Aurora when the database should stay compatible with MySQL or PostgreSQL and use Aurora storage.",
      "Choose an Aurora replica when reads should scale inside the Region.",
      "Choose provisioned Aurora when the load is steady enough that a fixed instance class is the right cost shape."],
     "the spikes are so irregular that a fixed instance would sit idle most of the day",
     "Aurora storage replaces DynamoDB for key-value items.", False,
     "Aurora is relational. Key-value at any scale is DynamoDB.")

core("dynamodb", "Amazon DynamoDB", "Database", "Regional", ["3.3", "4.3", "2.1"],
     "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html",
     "DynamoDB is a key-value and document database. You choose on-demand or provisioned capacity.",
     ["Choose DynamoDB when the application reads and writes items by key at any scale.",
      "Choose on-demand when traffic is spiky and you do not want to set read and write capacity.",
      "Choose DynamoDB Streams when an item change should invoke a downstream consumer."],
     "the workload is complex SQL with joins across normalized tables",
     "DynamoDB is the managed MySQL-compatible database.", False,
     "MySQL compatibility is Aurora or RDS. DynamoDB is key-value and document.",
     classes=[
         klass("DynamoDB on-demand", "Throughput mode for spiky or unknown traffic. You pay for the requests you make.", "4.3", DDB),
         klass("DynamoDB provisioned", "Throughput mode where you set read and write capacity for a predictable load.", "4.3", DDB),
     ])

core("elasticache", "Amazon ElastiCache", "Database", "Regional", ["3.3", "4.3", "3.4"],
     "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html",
     "ElastiCache is an in-memory cache in front of a database.",
     ["Choose ElastiCache when repeated reads should not all hit the database.",
      "Choose ElastiCache when the data can be rebuilt from the database if the cache is lost.",
      "Choose a cache node size for the working set, not as the only copy of the data."],
     "the cache must be the only durable copy of the orders",
     "ElastiCache is a durable system of record.", False,
     "A cache can be empty. The durable copy stays in the database or in S3.")

core("redshift", "Amazon Redshift", "Database", "Regional", ["3.3", "3.5", "4.3"],
     "https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html",
     "Amazon Redshift is the data warehouse. The appendix also lists it under Analytics.",
     ["Choose Redshift when analysts need a warehouse for structured data at scale.",
      "Choose Redshift when the query pattern is a warehouse, not ad hoc SQL over raw objects in S3.",
      "Choose a smaller cluster or Redshift Serverless when the warehouse is idle most of the time."],
     "you need to run one SQL query over objects that should stay in S3",
     "Redshift is the serverless SQL engine over objects left in S3.", False,
     "SQL over objects in S3 is Athena. Redshift is the warehouse.")

core("sqs", "Amazon SQS", "Application Integration", "Regional", ["2.1", "4.2"],
     "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html",
     "Amazon SQS is a queue. Producers send messages and consumers pull them.",
     ["Choose SQS when work arrives in bursts and workers should pull at their own pace.",
      "Choose a standard queue for high throughput and a FIFO queue when order and exactly-once processing matter."],
     "many subscribers must all receive a copy of the same event",
     "SQS pushes one message to every subscriber.", False,
     "A fan-out to many subscribers is SNS or EventBridge. SQS is the pull queue.",
     "SQS", "Amazon Simple Queue Service",
     classes=[
        klass("SQS standard", "At-least-once delivery and best-effort ordering.", "2.1", SQS_TYPES),
        klass("SQS FIFO", "Exactly-once processing, with first-in-first-out delivery inside a message group.", "2.1", SQS_TYPES),
     ])

core("sns", "Amazon SNS", "Application Integration", "Regional", ["2.1", "2.2"],
     "https://docs.aws.amazon.com/sns/latest/dg/welcome.html",
     "Amazon SNS publishes one message to many subscribers.",
     ["Choose SNS when one event should reach several subscribers, including an SQS queue.",
      "Choose SNS when a person or an endpoint should get a notification."],
     "one worker should pull a backlog and no one else should see that message",
     "SNS stores a backlog for a single competing consumer.", False,
     "A single competing consumer is SQS. SNS fans the message out.",
     "SNS", "Amazon Simple Notification Service")

core("eventbridge", "Amazon EventBridge", "Application Integration", "Regional", ["2.1", "3.5"],
     "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html",
     "EventBridge routes events from AWS services and your applications to targets by rule.",
     ["Choose EventBridge when a service event should match a rule and invoke a target.",
      "Choose EventBridge when the producer should not know the list of consumers."],
     "you need a durable pull queue with a visibility timeout",
     "EventBridge replaces SQS when a worker must pull and delete a message.", False,
     "Pull, visibility timeout, and delete are SQS. EventBridge routes events.")

core("step-functions", "AWS Step Functions", "Application Integration", "Regional", ["2.1", "3.2"],
     "https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html",
     "Step Functions runs a workflow of steps, with state between them.",
     ["Choose Step Functions when a process has several steps and you need the state and the retries in the workflow.",
      "Choose Step Functions when a failure in one step should take a defined catch path."],
     "one short function should run for a single event and then finish",
     "Step Functions is the queue that hides an in-flight message.", False,
     "The visibility timeout is SQS. Step Functions is the workflow.")

core("kinesis", "Amazon Kinesis", "Analytics", "Regional", ["3.5", "2.1"],
     "https://docs.aws.amazon.com/streams/latest/dev/introduction.html",
     "Kinesis Data Streams ingests an ordered stream that custom consumers can read.",
     ["Choose Kinesis Data Streams when many producers append records and consumers read the stream.",
      "Choose a stream when more than one consumer must read the same records."],
     "you need a single pull queue and each message should be processed by one worker",
     "Kinesis Data Streams deletes a record when one worker receives it, like a queue.", False,
     "A queue hands a message to one consumer. A stream keeps records for the consumers you attach.")

core("athena", "Amazon Athena", "Analytics", "Regional", ["3.5", "4.1"],
     "https://docs.aws.amazon.com/athena/latest/ug/what-is.html",
     "Athena runs SQL on data in S3 without loading it into a database first.",
     ["Choose Athena when analysts need SQL and the objects should stay in S3.",
      "Choose Athena when a warehouse cluster would sit idle between those queries."],
     "people need interactive charts and they do not write the SQL",
     "Athena is the dashboard product for business users.", False,
     "Dashboards are Amazon Quick, whose visualization feature is Quick Sight. Athena runs the SQL.")

core("glue", "AWS Glue", "Analytics", "Regional", ["3.5", "1.3"],
     "https://docs.aws.amazon.com/glue/latest/dg/what-is-glue.html",
     "AWS Glue catalogs data and runs ETL jobs.",
     ["Choose Glue when a crawler should infer a schema and a job should transform the data.",
      "Choose Glue when the transform should land in S3 or another supported store."],
     "you only need to query the objects once with SQL",
     "Glue is the interactive SQL engine over S3.", False,
     "Interactive SQL over S3 is Athena. Glue prepares and catalogs the data.")

core("dms", "AWS DMS", "Migration and Transfer", "Regional", ["3.5", "2.2"],
     "https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html",
     "AWS DMS migrates a database and can keep replicating changes during the cutover.",
     ["Choose AWS DMS when a database should move to AWS with ongoing replication.",
      "Choose AWS DMS when the source stays online until the cutover."],
     "you are moving files from a file server, not a database",
     "DMS is the file-transfer service for an NFS share.", False,
     "File transfer is DataSync or Storage Gateway. DMS moves databases.",
     "DMS", "AWS Database Migration Service")

core("datasync", "AWS DataSync", "Migration and Transfer", "Regional", ["4.4", "3.5"],
     "https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html",
     "DataSync copies files and objects over the network between on-premises storage and AWS.",
     ["Choose DataSync when a file share should copy to S3, EFS, or FSx on a schedule.",
      "Choose DataSync when the link can carry the data and you do not need to ship a device."],
     "the dataset is so large that shipping a device is the plan",
     "DataSync is the offline shipping device.", False,
     "Shipping a device is the Snow Family. DataSync copies over the network.")

core("snow", "AWS Snow Family", "Migration and Transfer", "Regional", ["4.4", "3.5"],
     "https://docs.aws.amazon.com/snowball/latest/developer-guide/what-is-snowball.html",
     "The Snow Family moves large datasets by shipping a device when the network is the wrong path.",
     ["Choose the Snow Family when the data volume makes a network copy impractical.",
      "Choose DataSync instead when the network can finish the copy on an acceptable schedule."],
     "a nightly incremental file copy fits on the existing link",
     "The Snow Family is the right tool for a small nightly sync.", False,
     "A scheduled network copy is DataSync. Snow is the offline shipment.")

core("cloudwatch", "Amazon CloudWatch", "Management and Governance", "Regional", ["2.2", "1.2"],
     "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html",
     "CloudWatch collects metrics, logs, and alarms.",
     ["Choose CloudWatch when an alarm should fire on a metric such as CPU or a custom value.",
      "Choose CloudWatch Logs when the application should ship logs to one place."],
     "you need a record of who called an API",
     "CloudWatch is the audit trail of API calls.", False,
     "API call history is CloudTrail. CloudWatch is metrics, logs, and alarms.")

core("cloudtrail", "AWS CloudTrail", "Management and Governance", "Regional", ["1.1", "1.2"],
     "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html",
     "CloudTrail records AWS API calls for the account.",
     ["Choose CloudTrail when you must answer who changed a resource.",
      "Choose an organization trail when every account should write to the same trail."],
     "you need an alarm on CPU utilization",
     "CloudTrail pages you when CPU stays high.", False,
     "A CPU alarm is CloudWatch. CloudTrail records the API call.")

core("config", "AWS Config", "Management and Governance", "Regional", ["1.2", "1.1"],
     "https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html",
     "AWS Config records resource configuration and can evaluate it against a rule.",
     ["Choose AWS Config when you need the history of how a resource was configured.",
      "Choose a Config rule when a noncompliant resource should be flagged."],
     "you need the identity of the API caller",
     "AWS Config is the API audit log.", False,
     "The API caller is in CloudTrail. Config records the resource configuration.")

core("systems-manager", "AWS Systems Manager", "Management and Governance", "Regional", ["1.2", "2.2"],
     "https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html",
     "Systems Manager operates instances, including patching and a shell that does not need an inbound port.",
     ["Choose Session Manager when an operator needs a shell without opening SSH to the world.",
      "Choose Patch Manager when instances should patch on a schedule."],
     "you need a record of every API call in the account",
     "The Systems Manager welcome page still expands the service name as SSM.", False,
     "The current welcome page titles the service AWS Systems Manager. SSM on that page names the agent, so this deck does not teach SSM as the expansion.")

core("savings-plans", "Savings Plans", "AWS Cost Management", "global", ["4.2", "3.2"],
     "https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html",
     "Savings Plans is a commitment discount for steady compute use, measured in dollars per hour.",
     ["Choose a Savings Plan when compute use is steady enough to commit.",
      "Choose On-Demand or Spot instead when the load is too irregular for a commitment."],
     "the job can be interrupted and should use spare capacity",
     "A Savings Plan is the interruptible spare-capacity option.", False,
     "Interruptible spare capacity is Spot. A Savings Plan is the commitment.")

# --- peripheral: the rest of the appendix ---
P = "https://docs.aws.amazon.com"
peripheral("data-exchange", "AWS Data Exchange", "Analytics", "Regional", "3.5", f"{P}/data-exchange/latest/userguide/what-is.html",
           "AWS Data Exchange subscribes to third-party data sets.",
           "Choose AWS Data Exchange when the data comes from a provider's published data set rather than your own bucket.")
peripheral("data-pipeline", "AWS Data Pipeline", "Analytics", "Regional", "3.5", f"{P}/datapipeline/latest/DeveloperGuide/what-is-datapipeline.html",
           "AWS Data Pipeline schedules data movement and processing.",
           "Choose AWS Data Pipeline only when an existing pipeline already uses it. New orchestration is usually Step Functions or Glue.")
peripheral("emr", "Amazon EMR", "Analytics", "Regional", "3.5", f"{P}/emr/latest/ManagementGuide/emr-what-is-emr.html",
           "Amazon EMR runs a managed cluster for big-data frameworks. The current page says it was previously called Amazon Elastic MapReduce.",
           "Choose Amazon EMR when a Spark or Hadoop job needs a cluster. Do not expand EMR as the current name.")
peripheral("lake-formation", "AWS Lake Formation", "Analytics", "Regional", "1.3", f"{P}/lake-formation/latest/dg/what-is-lake-formation.html",
           "Lake Formation sets permissions on a data lake catalog and the data it describes.",
           "Choose Lake Formation when access to the catalog and the underlying lake data should be granted in one place.")
peripheral("msk", "Amazon Managed Streaming for Apache Kafka", "Analytics", "Regional", "3.5", f"{P}/msk/latest/developerguide/what-is-msk.html",
           "Amazon MSK runs Apache Kafka as a managed cluster.",
           "Choose Amazon MSK when the application already produces and consumes Kafka topics.",
           "MSK", "Amazon Managed Streaming for Apache Kafka")
peripheral("opensearch", "Amazon OpenSearch Service", "Analytics", "Regional", "3.3", f"{P}/opensearch-service/latest/developerguide/what-is.html",
           "Amazon OpenSearch Service indexes data for search and log analytics.",
           "Choose OpenSearch Service when operators need to search logs by text and filter.")
peripheral("quick", "Amazon Quick", "Analytics", "Regional", "3.5", QUICK,
           "Amazon Quick is the appendix name. The current product page titles the service AWS Quick and says it evolved from Amazon QuickSight. AWS Quick Sight is the visualization feature inside it.",
           "Choose Amazon Quick when people need the Quick Sight visualization feature rather than writing the SQL themselves.")
# aliases handled below if peripheral() doesn't take them
peripheral("appflow", "Amazon AppFlow", "Application Integration", "Regional", "3.5", f"{P}/appflow/latest/userguide/what-is-appflow.html",
           "AppFlow transfers data between SaaS applications and AWS.",
           "Choose AppFlow when a SaaS product such as Salesforce should load into S3 on a schedule.")
peripheral("mq", "Amazon MQ", "Application Integration", "Regional", "2.1", f"{P}/amazon-mq/latest/developer-guide/welcome.html",
           "Amazon MQ runs a managed ActiveMQ or RabbitMQ broker.",
           "Choose Amazon MQ when an application already speaks a standard message-broker protocol and cannot move to SQS.")
peripheral("budgets", "AWS Budgets", "AWS Cost Management", "global", "4.2", f"{P}/cost-management/latest/userguide/budgets-managing-costs.html",
           "AWS Budgets alerts you when cost or usage crosses a threshold you set.",
           "Choose AWS Budgets when someone should be notified before a spend limit is passed.")
peripheral("cur", "AWS Cost and Usage Report", "AWS Cost Management", "global", "4.2", f"{P}/cur/latest/userguide/what-is-cur.html",
           "The Cost and Usage Report is the detailed billing export.",
           "Choose the Cost and Usage Report when finance needs the line-item billing file.")
peripheral("cost-explorer", "AWS Cost Explorer", "AWS Cost Management", "global", "4.2", f"{P}/cost-management/latest/userguide/ce-what-is.html",
           "Cost Explorer charts cost and usage and can forecast from history.",
           "Choose Cost Explorer when you need to see which service grew the bill.")
peripheral("batch", "AWS Batch", "Compute", "Regional", "3.2", f"{P}/batch/latest/userguide/what-is-batch.html",
           "AWS Batch runs batch jobs on compute it provisions.",
           "Choose AWS Batch when a queue of jobs should run to completion on managed compute.")
peripheral("beanstalk", "AWS Elastic Beanstalk", "Compute", "Regional", "3.2", f"{P}/elasticbeanstalk/latest/dg/Welcome.html",
           "Elastic Beanstalk deploys an application onto capacity it manages.",
           "Choose Elastic Beanstalk when you want to upload an application and let AWS handle the environment.")
peripheral("outposts", "AWS Outposts", "Compute", "Regional", "3.2", f"{P}/outposts/latest/userguide/what-is-outposts.html",
           "AWS Outposts runs AWS infrastructure in your own facility.",
           "Choose Outposts when data must stay on premises and still use AWS APIs.")
peripheral("serverless-app-repo", "AWS Serverless Application Repository", "Compute", "Regional", "3.2", f"{P}/serverlessrepo/latest/devguide/what-is-serverlessrepo.html",
           "The Serverless Application Repository publishes and deploys serverless applications.",
           "Choose the Serverless Application Repository when you want to deploy a published serverless app.")
peripheral("vmware-cloud", "VMware Cloud on AWS", "Compute", "Regional", "3.2", f"{P}/vmc/latest/userguide/what-is-vmware-cloud-on-aws.html",
           "VMware Cloud on AWS runs VMware workloads on AWS.",
           "Choose VMware Cloud on AWS when vSphere workloads should move without a rewrite.")
peripheral("wavelength", "AWS Wavelength", "Compute", "Regional", "4.4", f"{P}/wavelength/latest/developerguide/what-is-wavelength.html",
           "Wavelength places compute at a telecom edge for mobile latency.",
           "Choose Wavelength when a mobile application needs compute inside the carrier network.")
peripheral("ecr", "Amazon ECR", "Containers", "Regional", "3.2", f"{P}/AmazonECR/latest/userguide/what-is-ecr.html",
           "Amazon ECR stores container images.",
           "Choose ECR when an ECS or EKS task should pull an image from a private registry.",
           "ECR", "Amazon Elastic Container Registry")
peripheral("ecs-anywhere", "Amazon ECS Anywhere", "Containers", "Regional", "3.2", f"{P}/AmazonECS/latest/developerguide/ecs-anywhere.html",
           "ECS Anywhere runs ECS tasks on infrastructure you manage.",
           "Choose ECS Anywhere when the same ECS service should also run on premises.")
peripheral("eks-anywhere", "Amazon EKS Anywhere", "Containers", "Regional", "3.2", f"{P}/eks/latest/userguide/eks-anywhere.html",
           "EKS Anywhere runs Kubernetes clusters on your own infrastructure.",
           "Choose EKS Anywhere when the Kubernetes cluster must run outside the managed EKS control plane in a Region.")
peripheral("eks-distro", "Amazon EKS Distro", "Containers", "Regional", "3.2", f"{P}/eks/latest/userguide/eks-distro.html",
           "EKS Distro is the Kubernetes distribution used by Amazon EKS.",
           "Choose EKS Distro when you need the same Kubernetes bits EKS uses, on infrastructure you run.")
peripheral("aurora-serverless", "Amazon Aurora Serverless", "Database", "Regional", "4.3", f"{P}/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html",
           "Aurora Serverless scales Aurora capacity with the load.",
           "Choose Aurora Serverless when the database load is intermittent and a fixed instance would sit idle.")
peripheral("documentdb", "Amazon DocumentDB", "Database", "Regional", "4.3", f"{P}/documentdb/latest/developerguide/what-is.html",
           "Amazon DocumentDB is a document database compatible with MongoDB workloads.",
           "Choose DocumentDB when an application already uses MongoDB drivers.")
peripheral("keyspaces", "Amazon Keyspaces", "Database", "Regional", "4.3", f"{P}/keyspaces/latest/devguide/what-is-keyspaces.html",
           "Amazon Keyspaces is a managed Apache Cassandra-compatible database.",
           "Choose Keyspaces when the application uses Cassandra query language.")
peripheral("neptune", "Amazon Neptune", "Database", "Regional", "4.3", f"{P}/neptune/latest/userguide/intro.html",
           "Amazon Neptune is a graph database.",
           "Choose Neptune when the data is relationships you need to traverse.")
peripheral("xray", "AWS X-Ray", "Developer Tools", "Regional", "2.1", f"{P}/xray/latest/devguide/aws-xray.html",
           "AWS X-Ray traces a request across the services it touches.",
           "Choose X-Ray when you need a trace of one request through several services.")
peripheral("amplify", "AWS Amplify", "Front-End Web and Mobile", "Regional", "3.2", f"{P}/amplify/latest/userguide/welcome.html",
           "AWS Amplify hosts and builds front-end web and mobile applications.",
           "Choose Amplify when a front-end app should build and host from a repository.")
peripheral("api-gateway", "Amazon API Gateway", "Front-End Web and Mobile", "Regional", "2.1", f"{P}/apigateway/latest/developerguide/welcome.html",
           "API Gateway publishes an HTTP API in front of Lambda or another backend.",
           "Choose API Gateway when clients need a stable HTTP API that invokes a backend.")
peripheral("device-farm", "AWS Device Farm", "Front-End Web and Mobile", "Regional", "3.2", f"{P}/devicefarm/latest/developerguide/welcome.html",
           "AWS Device Farm tests an app on real phones and browsers.",
           "Choose Device Farm when a mobile build should run on a fleet of real devices.")
for mid, mname, muse in [
    ("comprehend", "Amazon Comprehend", "Choose Amazon Comprehend when text should be classified or have its entities extracted."),
    ("lex", "Amazon Lex", "Choose Amazon Lex when a conversational bot should understand speech or text."),
    ("polly", "Amazon Polly", "Choose Amazon Polly when text should become speech."),
    ("rekognition", "Amazon Rekognition", "Choose Amazon Rekognition when an image or video needs labels, faces, or text detected."),
    ("sagemaker", "Amazon SageMaker AI", "Choose Amazon SageMaker AI when you need to build, train, and deploy your own model."),
    ("textract", "Amazon Textract", "Choose Amazon Textract when a document's text and fields should be extracted."),
    ("transcribe", "Amazon Transcribe", "Choose Amazon Transcribe when speech should become text."),
    ("translate", "Amazon Translate", "Choose Amazon Translate when text should be translated."),
]:
    peripheral(mid, mname, "Machine Learning", "Regional", "3.2", f"{P}/machine-learning/latest/userguide/", 
               f"{mname} is a managed machine-learning service for that one job.", muse)

peripheral("aws-auto-scaling", "AWS Auto Scaling", "Management and Governance", "Regional", "2.1", f"{P}/autoscaling/plans/userguide/what-is-aws-auto-scaling.html",
           "AWS Auto Scaling is the scaling plan across more than one service, distinct from an EC2 Auto Scaling group.",
           "Choose AWS Auto Scaling when one plan should scale several resources, not only an EC2 group.")
peripheral("cli", "AWS CLI", "Management and Governance", "global", "1.1", f"{P}/cli/latest/userguide/cli-chap-welcome.html",
           "The AWS CLI calls AWS APIs from a command line.",
           "Choose the AWS CLI when a script or an operator should call an API without the console.",
           "CLI", "AWS Command Line Interface")
peripheral("cloudformation", "AWS CloudFormation", "Management and Governance", "Regional", "2.1", f"{P}/AWSCloudFormation/latest/UserGuide/Welcome.html",
           "CloudFormation creates and updates a stack from a template.",
           "Choose CloudFormation when the infrastructure should be described in a template and deployed as a stack.")
peripheral("compute-optimizer", "AWS Compute Optimizer", "Management and Governance", "Regional", "4.2", f"{P}/compute-optimizer/latest/ug/what-is-compute-optimizer.html",
           "Compute Optimizer recommends a compute size from observed utilization.",
           "Choose Compute Optimizer when an instance or function looks over-provisioned.")
peripheral("control-tower", "AWS Control Tower", "Management and Governance", "global", "1.1", f"{P}/controltower/latest/userguide/what-is-control-tower.html",
           "Control Tower sets up a multi-account landing zone with guardrails.",
           "Choose Control Tower when a new multi-account environment should start from a landing zone.")
peripheral("health-dashboard", "AWS Health Dashboard", "Management and Governance", "global", "2.2", f"{P}/health/latest/ug/what-is-aws-health.html",
           "The AWS Health Dashboard shows events that affect your resources.",
           "Choose the Health Dashboard when you need the service event behind an outage.")
peripheral("license-manager", "AWS License Manager", "Management and Governance", "Regional", "4.2", f"{P}/license-manager/latest/userguide/license-manager.html",
           "License Manager tracks software licenses used on AWS.",
           "Choose License Manager when license counts have to stay inside an agreement.")
peripheral("grafana", "Amazon Managed Grafana", "Management and Governance", "Regional", "2.2", f"{P}/grafana/latest/userguide/what-is-amazon-managed-service-grafana.html",
           "Amazon Managed Grafana hosts Grafana dashboards.",
           "Choose Managed Grafana when operators want Grafana charts over CloudWatch or Prometheus metrics.")
peripheral("prometheus", "Amazon Managed Service for Prometheus", "Management and Governance", "Regional", "2.2", f"{P}/prometheus/latest/userguide/what-is-Amazon-Managed-Service-Prometheus.html",
           "Amazon Managed Service for Prometheus stores Prometheus metrics.",
           "Choose Managed Service for Prometheus when container metrics are already in Prometheus format.")
peripheral("management-console", "AWS Management Console", "Management and Governance", "global", "1.1", f"{P}/awsconsolehelpdocs/latest/gsg/getting-started.html",
           "The AWS Management Console is the browser UI for AWS services.",
           "Choose the console when a person should click through a service rather than call the API.")
peripheral("proton", "AWS Proton", "Management and Governance", "Regional", "2.1", f"{P}/proton/latest/userguide/Welcome.html",
           "AWS Proton templates how platform teams publish infrastructure and application stacks.",
           "Choose Proton when a platform team wants self-service templates for other teams.")
peripheral("service-catalog", "AWS Service Catalog", "Management and Governance", "Regional", "1.1", f"{P}/servicecatalog/latest/adminguide/introduction.html",
           "Service Catalog publishes a list of products people are allowed to launch.",
           "Choose Service Catalog when users should launch an approved product and not a free-form stack.")
peripheral("well-architected", "AWS Well-Architected Tool", "Management and Governance", "Regional", "4.2", f"{P}/wellarchitected/latest/userguide/intro.html",
           "The Well-Architected Tool records a workload review against the framework.",
           "Choose the Well-Architected Tool when a workload review should be written down and tracked.")
peripheral("kinesis-video", "Amazon Kinesis Video Streams", "Media Services", "Regional", "3.5", f"{P}/kinesisvideostreams/latest/dg/what-is-kinesis-video.html",
           "Kinesis Video Streams ingests video from devices.",
           "Choose Kinesis Video Streams when cameras or devices stream video into AWS.")
peripheral("app-discovery", "AWS Application Discovery Service", "Migration and Transfer", "Regional", "4.2", f"{P}/application-discovery/latest/userguide/what-is-appdiscovery.html",
           "Application Discovery Service inventories on-premises servers before a migration.",
           "Choose Application Discovery Service when you need an inventory before planning the move.")
peripheral("application-migration", "AWS Application Migration Service", "Migration and Transfer", "Regional", "2.2", f"{P}/mgn/latest/ug/what-is-application-migration.html",
           "Application Migration Service replicates servers and cuts them over to AWS.",
           "Choose Application Migration Service for a lift-and-shift of servers.")
peripheral("transfer-family", "AWS Transfer Family", "Migration and Transfer", "Regional", "4.4", f"{P}/transfer/latest/userguide/what-is-aws-transfer-family.html",
           "Transfer Family serves S3 or EFS over SFTP, FTPS, or FTP.",
           "Choose Transfer Family when partners must upload with SFTP and the files should land in S3.")
peripheral("client-vpn", "AWS Client VPN", "Networking and Content Delivery", "Regional", "3.4", f"{P}/vpn/latest/clientvpn-admin/what-is.html",
           "Client VPN lets a person open a TLS VPN into a VPC.",
           "Choose Client VPN when a person, not a site, needs remote access to a VPC.")
peripheral("artifact", "AWS Artifact", "Security, Identity, and Compliance", "global", "1.1", f"{P}/artifact/latest/ug/what-is-aws-artifact.html",
           "AWS Artifact is the portal for compliance reports.",
           "Choose AWS Artifact when an auditor needs an AWS compliance report.")
peripheral("cloudhsm", "AWS CloudHSM", "Security, Identity, and Compliance", "Regional", "1.3", f"{P}/cloudhsm/latest/userguide/introduction.html",
           "CloudHSM is a hardware security module you administer.",
           "Choose CloudHSM when a key must live in a dedicated HSM you control, rather than in KMS.")
peripheral("detective", "Amazon Detective", "Security, Identity, and Compliance", "Regional", "1.2", f"{P}/detective/latest/userguide/what-is-detective.html",
           "Amazon Detective investigates findings by grouping related activity.",
           "Choose Detective when a GuardDuty finding needs a timeline of related events.")
peripheral("directory-service", "AWS Directory Service", "Security, Identity, and Compliance", "Regional", "1.1", f"{P}/directoryservice/latest/admin-guide/what_is.html",
           "AWS Directory Service runs a managed directory, including Microsoft AD.",
           "Choose Directory Service when Windows workloads need a managed Active Directory.")
peripheral("firewall-manager", "AWS Firewall Manager", "Security, Identity, and Compliance", "global", "1.2", f"{P}/waf/latest/developerguide/fms-chapter.html",
           "Firewall Manager applies WAF, Shield, security group, and Network Firewall policies across accounts.",
           "Choose Firewall Manager when one security policy should cover many accounts.")
peripheral("ram", "AWS Resource Access Manager", "Security, Identity, and Compliance", "Regional", "1.1", f"{P}/ram/latest/userguide/what-is.html",
           "AWS Resource Access Manager shares a resource with another account.",
           "Choose AWS Resource Access Manager when a subnet or another supported resource should be shared with another account.",
           "RAM", "AWS Resource Access Manager")
peripheral("security-hub", "AWS Security Hub", "Security, Identity, and Compliance", "Regional", "1.2", f"{P}/securityhub/latest/userguide/what-is-securityhub.html",
           "Security Hub collects findings from security services into one place.",
           "Choose Security Hub when GuardDuty, Inspector, and Macie findings should land in one view.")

# Amazon Quick aliases: peripheral() above didn't pass them. Patch the record.
for row in records:
    if row["id"] == "quick":
        row["aliases"] = ["Amazon QuickSight", "AWS Quick"]

# Fix the ML docs URL to each service's own page where we know it.
ml_docs = {
    "comprehend": f"{P}/comprehend/latest/dg/what-is.html",
    "lex": f"{P}/lex/latest/dg/what-is.html",
    "polly": f"{P}/polly/latest/dg/what-is.html",
    "rekognition": f"{P}/rekognition/latest/dg/what-is.html",
    "sagemaker": f"{P}/sagemaker/latest/dg/whatis.html",
    "textract": f"{P}/textract/latest/dg/what-is.html",
    "transcribe": f"{P}/transcribe/latest/dg/what-is.html",
    "translate": f"{P}/translate/latest/dg/what-is.html",
}
for row in records:
    if row["id"] in ml_docs:
        row["docsUrl"] = ml_docs[row["id"]]

out = Path(__file__).resolve().parents[1] / "content" / "saa-service-facts.json"
out.write_text(json.dumps({"records": records}, indent=2) + "\n")
print(f"records {len(records)} core {sum(1 for r in records if r['tier']=='core')} peripheral {sum(1 for r in records if r['tier']=='peripheral')}")
print("ids", len({r['id'] for r in records}), "names", len({r['name'] for r in records}))

counts = {}
def bump(task, n=1):
    counts[task] = counts.get(task, 0) + n
for fact in records:
    primary = fact["tasks"][0]
    bump(primary, 2)
    for index, _use in enumerate(fact["useWhen"]):
        bump(fact["tasks"][min(index, len(fact["tasks"]) - 1)])
    if fact.get("acronym") and fact.get("expansion"):
        bump(primary)
    if fact["tier"] == "core":
        bump(primary, 3)
        for entry in fact.get("classes") or []:
            bump(entry["task"])
        for entry in fact.get("numbers") or []:
            bump(entry["task"])
        for entry in fact.get("costs") or []:
            bump(entry["task"])
for task in ["1.1","1.2","1.3","2.1","2.2","3.1","3.2","3.3","3.4","3.5","4.1","4.2","4.3","4.4"]:
    print(f"{task} {counts.get(task, 0)}")
