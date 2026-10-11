import type {Metadata} from 'next';
import {SubnetGame} from '@/app/components/subnet/SubnetGame';
export const metadata:Metadata={title:'Subnet Architect | IPv4 and VLSM practice',description:'Verified subnet detective exercises and constraint-graded VLSM designs.'};
export default function SubnetArchitectPage(){return <SubnetGame/>;}
