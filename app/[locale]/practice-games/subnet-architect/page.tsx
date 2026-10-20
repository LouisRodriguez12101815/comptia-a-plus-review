import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {SubnetGame} from '@/app/components/subnet/SubnetGame';

export async function generateMetadata({params}: PageProps<"/[locale]/practice-games/subnet-architect">): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'subnetArchitectPage'});
  return {title: t('title'), description: t('description')};
}

export default async function SubnetArchitectPage({params}: PageProps<"/[locale]/practice-games/subnet-architect">){
  const {locale} = await params;
  setRequestLocale(locale);
  return <SubnetGame/>;
}
