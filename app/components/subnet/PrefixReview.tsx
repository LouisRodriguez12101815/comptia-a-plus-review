"use client";
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {calculate,equalSubnetCount} from '@/lib/subnet/ipv4';
export function PrefixReview({bits:initialBits}:{bits:number}){
  const t=useTranslations('prefixReview');
  const [bits,setBits]=useState(initialBits);
  const [parent,setParent]=useState('');let count=t('explicitHint');
  if(parent){try{if(!/^\d+$/.test(parent))throw new Error(t('numericPrefix'));count=t('equalChildren',{bits,parent,count:equalSubnetCount(Number(parent),bits)});}catch(e){count=(e as Error).message;}}
  const result=calculate('0.0.0.0',bits);
  return <section className="space-y-3 rounded-xl border border-amber-300/40 p-4"><h3 className="font-semibold">{t('heading')}</h3><label className="block text-sm">{t('visualizedPrefix')}<select aria-label={t('visualizedPrefix')} value={bits} onChange={e=>setBits(Number(e.target.value))} className="ml-2 rounded border border-slate-600 bg-slate-950 p-2">{Array.from({length:31},(_,p)=><option key={p} value={p}>/{p}</option>)}</select></label><p>{t('bitsSummary',{prefix:bits,bits,hostBits:32-bits,mask:result.mask})}</p><div className="flex flex-wrap gap-3 font-mono text-sm">{[0,8,16,24].map(start=><span key={start} className="rounded bg-slate-950 p-2">{Array.from({length:8},(_,i)=><span key={i} className={start+i<bits?'text-cyan-100':'text-amber-100'}>{start+i<bits?'1':'0'}</span>)}</span>)}</div><p className="text-xs text-slate-300">{t('legend')}</p><label className="block text-sm">{t('parentLabel',{bits})}<input aria-label={t('parentAria')} inputMode="numeric" value={parent} onChange={e=>setParent(e.target.value)} className="ml-2 w-20 rounded border border-slate-600 bg-slate-950 p-2"/></label><p role="status" className="text-sm">{count}</p></section>;
}
