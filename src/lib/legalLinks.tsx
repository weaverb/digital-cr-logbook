export const CFR_27_478_125F_URL = 'https://www.ecfr.gov/current/title-27/chapter-II/subchapter-B/part-478/subpart-H/section-478.125#p-478.125(f)';
export const ATF_RULING_2016_1_URL = 'https://www.atf.gov/firearms/docs/ruling/2016-1-requirements-keep-firearms-records-electronically/download';

export interface LegalLinkProps {
  text?: string;
  className?: string;
}

export function CfrLink({ text = '27 CFR § 478.125(f)', className = 'underline hover:text-amber-400 transition-colors font-medium' }: LegalLinkProps) {
  return (
    <a
      href={CFR_27_478_125F_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title="View official Electronic Code of Federal Regulations (eCFR) text"
    >
      {text}
    </a>
  );
}

export function AtfRulingLink({ text = 'ATF Ruling 2016-1', className = 'underline hover:text-amber-400 transition-colors font-medium' }: LegalLinkProps) {
  return (
    <a
      href={ATF_RULING_2016_1_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title="View official ATF Ruling 2016-1 PDF document"
    >
      {text}
    </a>
  );
}
