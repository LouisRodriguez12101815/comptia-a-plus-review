import type { Question } from "@/lib/types";

/** A pair shares one scenario. The qualifier changes, and so does the answer. */
export type QualifierTwin = Question & {
  pairId: string;
  scenario: string;
  qualifier: "MOST cost-effective" | "LEAST operational overhead" | "MOST resilient" | "MOST secure";
  audit: { taskId: string; docsUrl: string; retrievalDate: string };
};

const TOPIC = "aws-saa-storage";
const RETRIEVED = "2026-11-20";

function twin(input: {
  id: string;
  pairId: string;
  scenario: string;
  qualifier: QualifierTwin["qualifier"];
  choices: string[];
  answer: number;
  why: string[];
  taskId: string;
  docsUrl: string;
}): QualifierTwin {
  const explanation = input.choices.map((choice, index) => {
    const verdict = index === input.answer ? "Correct" : "Incorrect";
    return `Option: ${choice} — ${verdict}: ${input.why[index]}`;
  }).join("\n");
  return {
    id: input.id,
    pairId: input.pairId,
    scenario: input.scenario,
    qualifier: input.qualifier,
    topicId: TOPIC,
    examCodes: ["saa-c03"],
    objectiveIds: { "saa-c03": [input.taskId] },
    sourceUrls: [input.docsUrl],
    prompt: `${input.scenario} Which design is the ${input.qualifier} choice?`,
    choices: input.choices,
    answer: input.answer,
    explanation,
    audit: { taskId: input.taskId, docsUrl: input.docsUrl, retrievalDate: RETRIEVED },
  };
}

const brochure = "A company publishes a brochure as static files that change a few times a year. Readers are in many Regions.";
const brochureChoices = [
  "Amazon S3 for the files, with CloudFront in front",
  "S3 cross-Region replication plus a Route 53 failover record",
  "One Amazon EFS file system mounted by a single EC2 instance",
  "An AWS Snowball device mailed to each reader",
];

const database = "A relational application has short busy periods and is idle most of the day. The team does not want to run its own database servers.";
const databaseChoices = [
  "Amazon Aurora with a writer and Amazon RDS-style Multi-AZ storage",
  "Amazon Aurora Serverless v2, so capacity can drop while the app is idle",
  "MySQL installed on one EC2 instance in one Availability Zone",
  "An Aurora read replica used as the only writer",
];

const keys = "Objects in Amazon S3 must be encrypted at rest. The security team wants to decide who can use the key.";
const keyChoices = [
  "SSE-S3, with Amazon S3 managing the encryption key",
  "SSE-KMS with a customer managed key and a key policy",
  "A public-read bucket policy and no encryption",
  "The access key written into each object's metadata",
];

const fanout = "Orders must reach billing, shipping, and email. A subscriber can be offline for a while and must not lose the order.";
const fanoutChoices = [
  "One Amazon SNS topic that calls each app directly and waits",
  "An Amazon SNS topic with an Amazon SQS queue for each subscriber",
  "One Amazon SQS queue that only the first app is allowed to read",
  "Each app polls an EC2 instance for a file on local disk",
];

const jobs = "A job runs for a few seconds when a file arrives. It should not need a server that stays on all day, and it should reach a private database.";
const jobChoices = [
  "AWS Lambda, invoked when the file arrives",
  "One EC2 instance left running overnight in a public subnet",
  "AWS Lambda in a VPC, with an IAM role and no public function URL",
  "A shared IAM access key baked into the deployment package",
];

const move = "A database must keep replicating to AWS until cutover. The replication path should not sit on the public internet.";
const moveChoices = [
  "AWS Database Migration Service for the ongoing copy",
  "An AWS Snowball device ordered again every night",
  "A DMS replication instance in private subnets",
  "A public snapshot shared with every AWS account",
];

const cache = "A read-heavy key-value cache must survive the loss of one Availability Zone, and clients must authenticate.";
const cacheChoices = [
  "Amazon ElastiCache with a replica in a second Availability Zone",
  "Application cache files kept on a single instance store volume inside the account",
  "Amazon CloudFront placed in front of the database endpoint",
  "Amazon ElastiCache in private subnets with in-transit encryption and AUTH",
];

const edge = "A public HTTP site is served from two origins. Most requests repeat the same files.";
const edgeChoices = [
  "Amazon CloudFront caching the repeated files",
  "CloudFront with origin failover to the second origin",
  "One public Application Load Balancer and no cache",
  "AWS Global Accelerator with no cache in front of the files",
];

const share = "A bucket must stay closed to the public. One partner needs to download a single object today.";
const shareChoices = [
  "S3 Block Public Access left on for the bucket",
  "A presigned URL that expires after this download",
  "An object ACL that grants public-read on the object for the partner today",
  "An IAM access key sent to the partner by email",
];

const org = "People in several accounts need a sign-in, and a deny must apply even if an account administrator adds a broader permission.";
const orgChoices = [
  "IAM Identity Center permission sets for workforce sign-in",
  "An Organizations service control policy denying the action",
  "A root user access key created and stored for every member account",
  "An S3 bucket policy attached in one account",
];

export const qualifierTwins: QualifierTwin[] = [
  twin({
    id: "q-saa-twin-01-cost",
    pairId: "twin-01",
    scenario: brochure,
    qualifier: "MOST cost-effective",
    choices: brochureChoices,
    answer: 0,
    taskId: "4.1",
    docsUrl: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html",
    why: [
      "Static files that rarely change fit S3, and CloudFront serves the repeated reads from the edge without a server running all day.",
      "Cross-Region replication and failover add a second full copy and DNS health checks. That is a resilience design, not the cheapest one for a brochure.",
      "EFS plus an always-on instance bills for a file system and a server the brochure does not need.",
      "Snowball moves a physical appliance. It is not a way to publish a site to readers.",
    ],
  }),
  twin({
    id: "q-saa-twin-01-resilient",
    pairId: "twin-01",
    scenario: brochure,
    qualifier: "MOST resilient",
    choices: brochureChoices,
    answer: 1,
    taskId: "2.2",
    docsUrl: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html",
    why: [
      "CloudFront and one bucket survive an Availability Zone problem, but both still depend on one Region's origin.",
      "Replication keeps a second Regional copy, and Route 53 failover can send readers there when the first origin is unhealthy.",
      "One instance in one place is a single failure domain for both compute and the files.",
      "Mailing appliances does not fail a live site over to another Region.",
    ],
  }),
  twin({
    id: "q-saa-twin-02-ops",
    pairId: "twin-02",
    scenario: database,
    qualifier: "LEAST operational overhead",
    choices: databaseChoices,
    answer: 0,
    taskId: "3.3",
    docsUrl: "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.html",
    why: [
      "Aurora is a managed relational database. AWS runs the storage and the failover machinery, so the team does not patch database servers.",
      "Serverless v2 is also managed, but its reason to exist here is scaling idle capacity down, which is a cost choice.",
      "Installing MySQL on EC2 leaves patching, backups, and failover to the team.",
      "A read replica is for reads. It does not replace the writer the application needs.",
    ],
  }),
  twin({
    id: "q-saa-twin-02-cost",
    pairId: "twin-02",
    scenario: database,
    qualifier: "MOST cost-effective",
    choices: databaseChoices,
    answer: 1,
    taskId: "4.3",
    docsUrl: "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html",
    why: [
      "Provisioned Aurora keeps capacity ready all day, including the long idle stretches this application has.",
      "Aurora Serverless v2 can lower capacity while the application is idle and raise it for the short busy periods.",
      "An EC2 database still bills for the instance and adds operational work the team said they do not want.",
      "A read replica does not accept the writes, so it cannot be the database.",
    ],
  }),
  twin({
    id: "q-saa-twin-03-cost",
    pairId: "twin-03",
    scenario: keys,
    qualifier: "LEAST operational overhead",
    choices: keyChoices,
    answer: 0,
    taskId: "1.3",
    docsUrl: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingServerSideEncryption.html",
    why: [
      "SSE-S3 encrypts the objects and Amazon S3 manages the key, so there is no key policy to write.",
      "A customer managed key is the right control when the team must decide key use, and that is more to operate.",
      "A public-read policy exposes the objects and does not meet the encryption requirement.",
      "Putting an access key in metadata discloses a credential and does not encrypt the object.",
    ],
  }),
  twin({
    id: "q-saa-twin-03-secure",
    pairId: "twin-03",
    scenario: keys,
    qualifier: "MOST secure",
    choices: keyChoices,
    answer: 1,
    taskId: "1.3",
    docsUrl: "https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html",
    why: [
      "SSE-S3 encrypts the data, but the team cannot write a key policy for who may use that key.",
      "A customer managed key lets the key policy decide who can use the key, which matches the security team's requirement.",
      "Public read removes access control instead of adding it.",
      "An access key in metadata is a leaked credential, not a key-management control.",
    ],
  }),
  twin({
    id: "q-saa-twin-04-ops",
    pairId: "twin-04",
    scenario: fanout,
    qualifier: "LEAST operational overhead",
    choices: fanoutChoices,
    answer: 0,
    taskId: "2.1",
    docsUrl: "https://docs.aws.amazon.com/sns/latest/dg/welcome.html",
    why: [
      "One SNS topic fans a message out to subscribers. The publisher does not keep a list of hosts or wait on each app.",
      "A queue per subscriber is the resilient version, because an offline app can catch up. It is more to set up than the topic alone.",
      "One queue with one consumer does not deliver the order to billing, shipping, and email.",
      "A file on one instance disk is a single host the team has to keep up.",
    ],
  }),
  twin({
    id: "q-saa-twin-04-resilient",
    pairId: "twin-04",
    scenario: fanout,
    qualifier: "MOST resilient",
    choices: fanoutChoices,
    answer: 1,
    taskId: "2.1",
    docsUrl: "https://docs.aws.amazon.com/sns/latest/dg/sns-sqs-as-subscriber.html",
    why: [
      "A direct subscription can miss work when the subscriber is down, unless something stores the message.",
      "SNS delivers into a queue per subscriber, so an offline app reads the order later instead of losing it.",
      "A single consumer queue leaves the other two applications without a copy.",
      "Local disk on one instance disappears with that instance and is not a fan-out.",
    ],
  }),
  twin({
    id: "q-saa-twin-05-cost",
    pairId: "twin-05",
    scenario: jobs,
    qualifier: "MOST cost-effective",
    choices: jobChoices,
    answer: 0,
    taskId: "4.2",
    docsUrl: "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html",
    why: [
      "Lambda runs for the few seconds the file needs and does not bill an instance that sits idle all day.",
      "An EC2 instance left running overnight is paying for time the job is not doing work.",
      "A VPC attachment is the private-network choice. It is not what makes the short job cheaper.",
      "A shared access key does not change the compute bill and it exposes a credential.",
    ],
  }),
  twin({
    id: "q-saa-twin-05-secure",
    pairId: "twin-05",
    scenario: jobs,
    qualifier: "MOST secure",
    choices: jobChoices,
    answer: 2,
    taskId: "1.2",
    docsUrl: "https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html",
    why: [
      "Lambda without a VPC placement does not by itself put the function on the private network with the database.",
      "A public instance plus a long-running server adds an exposed host the job does not need.",
      "Lambda in the VPC uses an IAM role for AWS permissions and has no public function URL, so the private database path stays private.",
      "An access key in the package is a long-lived secret in the wrong place.",
    ],
  }),
  twin({
    id: "q-saa-twin-06-cost",
    pairId: "twin-06",
    scenario: move,
    qualifier: "MOST cost-effective",
    choices: moveChoices,
    answer: 0,
    taskId: "3.5",
    docsUrl: "https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html",
    why: [
      "DMS keeps copying changes until cutover, so the team does not ship a new device every night.",
      "A new Snowball every night is a physical transfer, not an ongoing database replication, and it repeats the shipping cost.",
      "Private subnets are the secure placement of the replication instance. They are not the reason the copy is cheaper.",
      "A public snapshot share does not replicate the database and it exposes the data.",
    ],
  }),
  twin({
    id: "q-saa-twin-06-secure",
    pairId: "twin-06",
    scenario: move,
    qualifier: "MOST secure",
    choices: moveChoices,
    answer: 2,
    taskId: "1.2",
    docsUrl: "https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Security.html",
    why: [
      "DMS can copy the database, but the qualifier here is the path. A replication instance still needs a private placement.",
      "Shipping appliances does not keep a continuous private replication path.",
      "A replication instance in private subnets keeps the migration off a public address.",
      "Sharing a snapshot publicly exposes the database to accounts that should not have it.",
    ],
  }),
  twin({
    id: "q-saa-twin-07-resilient",
    pairId: "twin-07",
    scenario: cache,
    qualifier: "MOST resilient",
    choices: cacheChoices,
    answer: 0,
    taskId: "2.2",
    docsUrl: "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html",
    why: [
      "A replica in a second Availability Zone gives the cache another copy when one zone is lost.",
      "One instance store volume is lost with that instance and is not shared.",
      "CloudFront caches HTTP. It is not the cache for this key-value store.",
      "Private subnets, encryption, and AUTH are the access controls. They do not add the second Availability Zone.",
    ],
  }),
  twin({
    id: "q-saa-twin-07-secure",
    pairId: "twin-07",
    scenario: cache,
    qualifier: "MOST secure",
    choices: cacheChoices,
    answer: 3,
    taskId: "1.3",
    docsUrl: "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/in-transit-encryption.html",
    why: [
      "A replica improves availability. It does not by itself require clients to authenticate.",
      "An instance store has no client authentication for a shared cache.",
      "CloudFront is the wrong service for this database-style cache.",
      "Private subnets, in-transit encryption, and AUTH keep the cache off the public network and require clients to authenticate.",
    ],
  }),
  twin({
    id: "q-saa-twin-08-cost",
    pairId: "twin-08",
    scenario: edge,
    qualifier: "MOST cost-effective",
    choices: edgeChoices,
    answer: 0,
    taskId: "4.4",
    docsUrl: "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html",
    why: [
      "CloudFront serves the repeated files from the cache, so those requests do not all go back to the origins.",
      "Origin failover is the resilience addition. The cost win for repeated files is the cache itself.",
      "An origin load balancer with no cache sends every repeated request to the application.",
      "Global Accelerator does not cache the files, so repeated HTTP reads still hit an origin.",
    ],
  }),
  twin({
    id: "q-saa-twin-08-resilient",
    pairId: "twin-08",
    scenario: edge,
    qualifier: "MOST resilient",
    choices: edgeChoices,
    answer: 1,
    taskId: "2.2",
    docsUrl: "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/high_availability_origin_failover.html",
    why: [
      "A cache helps repeated reads. It does not by itself switch to the second origin when the first one fails.",
      "Origin failover sends the request to the second origin when the first origin fails its health check.",
      "One load balancer and no second origin leaves a single place for the site to fail.",
      "Global Accelerator routes network traffic. It does not fail an HTTP origin over to the second file origin.",
    ],
  }),
  twin({
    id: "q-saa-twin-09-secure",
    pairId: "twin-09",
    scenario: share,
    qualifier: "MOST secure",
    choices: shareChoices,
    answer: 0,
    taskId: "1.3",
    docsUrl: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html",
    why: [
      "Block Public Access stops a public ACL or public bucket policy from opening the bucket.",
      "A presigned URL is how one partner downloads one object. It is not the control that keeps the bucket closed.",
      "A public-read ACL is the exposure Block Public Access is there to stop.",
      "Emailing an access key gives away a credential that can outlive the one download.",
    ],
  }),
  twin({
    id: "q-saa-twin-09-ops",
    pairId: "twin-09",
    scenario: share,
    qualifier: "LEAST operational overhead",
    choices: shareChoices,
    answer: 1,
    taskId: "1.1",
    docsUrl: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html",
    why: [
      "Leaving Block Public Access on is the security baseline. It does not hand the partner today's object.",
      "A presigned URL grants that one download and expires, without a new IAM user or a public object.",
      "A public ACL is less work only because it removes the access control the bucket is required to keep.",
      "Creating and emailing an access key means a long-lived credential to rotate and revoke.",
    ],
  }),
  twin({
    id: "q-saa-twin-10-ops",
    pairId: "twin-10",
    scenario: org,
    qualifier: "LEAST operational overhead",
    choices: orgChoices,
    answer: 0,
    taskId: "1.1",
    docsUrl: "https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html",
    why: [
      "IAM Identity Center is the workforce sign-in. People get permission sets without a password and a key in every account.",
      "An SCP is the guardrail that still denies an action after an administrator adds a broader permission. It is not the sign-in.",
      "Root access keys are long-lived credentials the team would have to protect in every account.",
      "One bucket policy does not sign people in and does not cover the other accounts.",
    ],
  }),
  twin({
    id: "q-saa-twin-10-secure",
    pairId: "twin-10",
    scenario: org,
    qualifier: "MOST secure",
    choices: orgChoices,
    answer: 1,
    taskId: "1.1",
    docsUrl: "https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html",
    why: [
      "Permission sets grant workforce access. They do not win when an account administrator attaches a broader identity policy.",
      "A service control policy can deny the action for the accounts even when an identity policy would allow it.",
      "Root keys are the opposite of a guardrail. They are credentials to lock away.",
      "A bucket policy in one account cannot deny the action in the other accounts.",
    ],
  }),
];
