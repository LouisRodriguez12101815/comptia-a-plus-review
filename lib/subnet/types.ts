export type Exercise = { id: string; ip: string; prefix: number; source: {image:number;problem:number;status:string;parentPrefix:null}; expected: {network:string;mask:string;broadcast:string;first:string;last:string;capacity:number;isHost:boolean;blockSize:number;blockOctet:number} };
export type Requirement = { id:string; label:string; hosts:number; kind:"lan"|"link" };
export type DesignMission = { id:string;title:string;parent:string;source:string;requirements:Requirement[];fixture:string[];verifiedFixture:{id:string;cidr:string;mask:string;broadcast:string;first:string;last:string;capacity:number}[] };
export type Allocation = { cidr:string; gateway:string; peer:string };
export type Concept = {sourceIds?:string[];id:string;prompt:string;choices:{id:string;label:string;correct:boolean;explanation:string}[]};
export type SubnetData = {version:number; exam:{certification:string;code:string;objectivesVersion:string;objective:string;source:string};exercises:Exercise[];transferExercise:Exercise;missions:DesignMission[];unresolved:{id:string;reason:string}[];concepts:Concept[];optionalIpv6:Concept[];sources:{id:string;path?:string;href?:string;scope:string}[]};
