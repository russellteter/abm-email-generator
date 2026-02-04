/**
 * Word document generator for email sequences
 *
 * Builds formatted Word documents from email sequences using the docx library.
 * Uses Class Technologies brand colors (Navy, Purple, Light Purple).
 */

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';
import type { EmailSequence, EmailVariant } from '@/lib/email-generator';

// Class brand colors (without # prefix for docx library)
const COLORS = {
  navy: '0A1849',
  purple: '4739E7',
  lightPurple: 'EBE9FC',
  footerBg: 'F6F6FE',
};

// Font sizes in half-points (size: 32 = 16pt)
const SIZES = {
  title: 32, // 16pt
  subtitle: 22, // 11pt
  header: 24, // 12pt
  body: 22, // 11pt
  footer: 18, // 9pt
};

/**
 * Creates a formatted table for a single email
 * Structure: Header row (email number + subject), Body row (email text), Footer row (word count)
 */
function createEmailTable(email: EmailVariant): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.purple },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.purple },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.purple },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.purple },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.lightPurple },
    },
    rows: [
      // Header row with email number and subject line
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.lightPurple },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Email ${email.email_number}: `,
                    bold: true,
                    size: SIZES.header,
                    color: COLORS.navy,
                  }),
                  new TextRun({
                    text: email.subject_line,
                    size: SIZES.header,
                    color: COLORS.navy,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Body row with email content
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: email.body,
                    size: SIZES.body,
                    color: COLORS.navy,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Footer row with word count
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.footerBg },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Word count: ${email.word_count}`,
                    size: SIZES.footer,
                    italics: true,
                    color: COLORS.purple,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates a Word document from an email sequence
 *
 * @param contactName - Name of the contact
 * @param contactTitle - Job title of the contact
 * @param accountName - Name of the organization
 * @param emails - 3-email sequence to include in document
 * @returns Document object ready for export
 */
export function createEmailDocument(
  contactName: string,
  contactTitle: string,
  accountName: string,
  emails: EmailSequence
): Document {
  // Build document children: title, subtitle, then emails with tables
  const children: (Paragraph | Table)[] = [
    // Document title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Email Sequence for ${contactName}`,
          bold: true,
          size: SIZES.title,
          color: COLORS.navy,
        }),
      ],
      spacing: { after: 100 },
    }),
    // Document subtitle
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${contactTitle} at ${accountName}`,
          size: SIZES.subtitle,
          color: COLORS.navy,
        }),
      ],
      spacing: { after: 400 },
    }),
  ];

  // Add each email as a table with spacing
  emails.forEach((email, index) => {
    children.push(createEmailTable(email));

    // Add spacing between emails (except after last one)
    if (index < emails.length - 1) {
      children.push(
        new Paragraph({
          children: [],
          spacing: { after: 200 },
        })
      );
    }
  });

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}
