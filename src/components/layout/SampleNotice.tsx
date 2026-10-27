import { t } from '../../i18n';
import { useAnalysis } from '../../state/analysis';
import { useApp } from '../../state/store';
import { Callout } from '../ui';

/** Says on every page that the sample report is made up, with a way to open a real report. */
export function SampleNotice() {
  const { dataset } = useAnalysis();
  const setPickingData = useApp((state) => state.setPickingData);
  const savedList = useApp((state) => state.settings.roster.length > 0);
  if (!dataset.sample) return null;
  return (
    <Callout
      tone="accent"
      className="mb-4"
      title={t('This is a sample report')}
      action={
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setPickingData(true)}>
          {t('Open your report')}
        </button>
      }
    >
      {t('The people, organizations and numbers are made up in this browser tab. Open your own usage report to see your real numbers.')}
      {savedList ? <> {t('Your saved license list is not used here, so no real names appear in the sample.')}</> : null}
    </Callout>
  );
}

/** Says, where a license list is imported or managed, that the sample never uses it. */
export function SampleListNote() {
  const sample = useApp((state) => state.dataset?.sample === true);
  if (!sample) return null;
  return (
    <Callout tone="info" title={t('License lists are not used with the sample')}>
      {t('A license list holds real people, so the app never joins it to the made-up sample. A list you import here is saved and used when you open your own usage report.')}
    </Callout>
  );
}
