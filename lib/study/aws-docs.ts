/** Official pages used when a card or pair needs a documentation link. */
const SERVICE_DOCS: Record<string, string> = {
  "AWS Identity and Access Management": "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html",
  "AWS Security Token Service": "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html",
  "Amazon S3": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html",
  "Amazon EBS": "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AmazonEBS.html",
  "Amazon EFS": "https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html",
  "Amazon FSx": "https://docs.aws.amazon.com/fsx/latest/WindowsGuide/what-is.html",
  "Amazon EC2": "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html",
  "AWS Lambda": "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html",
  "Amazon VPC": "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html",
  "Amazon Route 53": "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html",
  "Amazon RDS": "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html",
  "Amazon DynamoDB": "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html",
  "Amazon DynamoDB Accelerator": "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html",
  "Amazon SQS": "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html",
  "Amazon SNS": "https://docs.aws.amazon.com/sns/latest/dg/welcome.html",
  "Amazon EventBridge": "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html",
  "Amazon CloudFront": "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html",
  "AWS Global Accelerator": "https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html",
  "AWS Key Management Service": "https://docs.aws.amazon.com/kms/latest/developerguide/overview.html",
  "AWS CloudHSM": "https://docs.aws.amazon.com/cloudhsm/latest/userguide/introduction.html",
  "AWS Secrets Manager": "https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html",
  "AWS WAF": "https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html",
  "AWS Shield": "https://docs.aws.amazon.com/waf/latest/developerguide/shield-chapter.html",
  "Amazon Macie": "https://docs.aws.amazon.com/macie/latest/user/what-is-macie.html",
  "Amazon GuardDuty": "https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html",
  "AWS CloudTrail": "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html",
  "AWS Config": "https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html",
  "Amazon CloudWatch": "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html",
  "AWS Fargate": "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html",
  "AWS Systems Manager": "https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html",
  "AWS DataSync": "https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html",
  "AWS Storage Gateway": "https://docs.aws.amazon.com/storagegateway/latest/userguide/WhatIsStorageGateway.html",
  "AWS Transit Gateway": "https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html",
  "AWS Direct Connect": "https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html",
  "AWS Certificate Manager": "https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html",
  "Amazon Redshift": "https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html",
  "Amazon Kinesis": "https://docs.aws.amazon.com/streams/latest/dev/introduction.html",
  "Savings Plans": "https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html",
  "Amazon Aurora": "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html",
  "AWS Site-to-Site VPN": "https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html",
  "AWS Auto Scaling": "https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html",
  "Amazon EC2 Auto Scaling": "https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html",
  "Elastic Load Balancing": "https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html",
  "Amazon ElastiCache": "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html",
  "AWS Organizations": "https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html",
  "Amazon Cognito": "https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html",
  "Amazon Inspector": "https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html",
  "AWS Backup": "https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html",
};

function domainGuide(taskId: string): string {
  return `https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain${taskId[0]}.html`;
}

/** Prefer the page that matches the card text, then the first known service, then the task's domain guide. */
export function docsUrlFor(taskId: string, services: string[], text: string): string {
  if (/Firehose/i.test(text) && !/Data Streams/i.test(text)) {
    return "https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html";
  }
  if (/PrivateLink|VPC endpoint/i.test(text)) {
    return "https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html";
  }
  if (/NAT gateway/i.test(text)) {
    return "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html";
  }
  if (/read replica/i.test(text)) {
    return "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html";
  }
  if (/Multi-AZ/i.test(text)) {
    return "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html";
  }
  if (/Savings Plans/i.test(text)) return SERVICE_DOCS["Savings Plans"];
  if (/\bSpot\b/.test(text)) {
    return "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html";
  }
  for (const service of services) {
    if (SERVICE_DOCS[service]) return SERVICE_DOCS[service];
  }
  return domainGuide(taskId);
}
