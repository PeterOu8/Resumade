import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { TailorResult } from '@/lib/types';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, marginBottom: 6, fontWeight: 700 },
  h2: { fontSize: 13, marginTop: 12, marginBottom: 6, fontWeight: 700 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  chip: {
    border: 1,
    borderColor: '#222',
    padding: 3,
    marginRight: 4,
    marginBottom: 4,
    borderRadius: 2,
  },
  bullet: { marginBottom: 3 },
  small: { color: '#444' },
});

export default function ResumePDF({ data }: { data: TailorResult }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Tailored Resume</Text>

        <Text style={styles.h2}>Summary</Text>
        <Text>{data.summary}</Text>

        {!!data.keySkills?.length && (
          <>
            <Text style={styles.h2}>Key Skills</Text>
            <View style={styles.chipRow}>
              {data.keySkills.map((s, i) => (
                <Text key={i} style={styles.chip}>
                  {s}
                </Text>
              ))}
            </View>
          </>
        )}

        {!!data.experience?.length && (
          <>
            <Text style={styles.h2}>Experience</Text>
            {data.experience.map((exp, i) => (
              <View key={i} wrap={false} style={{ marginBottom: 8 }}>
                <Text>
                  {exp.title} — {exp.company}{' '}
                  {!!exp.dates && (
                    <Text style={styles.small}>({exp.dates})</Text>
                  )}
                </Text>
                <View style={{ marginTop: 4 }}>
                  {exp.bullets.map((b, j) => (
                    <Text key={j} style={styles.bullet}>
                      • {b}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        {!!data.education?.length && (
          <>
            <Text style={styles.h2}>Education</Text>
            {data.education.map((e, i) => (
              <Text key={i}>• {e}</Text>
            ))}
          </>
        )}

        {!!data.atsHints?.length && (
          <>
            <Text style={styles.h2}>ATS Hints</Text>
            {data.atsHints.map((h, i) => (
              <Text key={i} style={styles.bullet}>
                • {h}
              </Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
