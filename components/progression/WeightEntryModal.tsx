import { QUICK_ADJUSTMENTS, WEIGHT_STEP } from '../../constants/progression';
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
  return (
    <NumberStepperModal
      visible={visible}
      title="Ton poids aujourd'hui"
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
