import { Text } from '@react-pdf/renderer';

type SkillProps = { category: string; skills: string[] };

export default function Skills({ category: category, skills }: SkillProps) {
  return (
    <Text style={{ paddingVertical: 1 }}>
      <Text style={{ fontWeight: 700 }}>{category}: </Text>
      <Text>{skills.join(', ')}</Text>
    </Text>
  );
}
