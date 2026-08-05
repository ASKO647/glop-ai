import { QUICK_ADJUSTMENTS, WEIGHT_STEP } from '../../constants/progression';
import { useLocale } from '../../context/LocaleContext';
import NumberStepperModal from '../ui/NumberStepperModal';

const DEFAULT_WEIGHT = 70;

type WeightEntryModalProps = {
  visible: boolean;
  initialValue: number | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (poids: number) => void;
};

export default function WeightEntryModal({ visible, initialValue, saving, onCancel, onSave }: WeightEntryModalProps) {
  const { t } = useLocale();
  return (
    <NumberStepperModal
      visible={visible}
      title={t('progression.weightEntryModal.title')}
      initialValue={initialValue ?? DEFAULT_WEIGHT}
      unit="kg"
      step={WEIGHT_STEP}
      quickAdjustments={QUICK_ADJUSTMENTS}
      saving={saving}
      onCancel={onCancel}
      onSave={onSave}
    />
  );
}
