import type { Metadata } from 'next';
import { LuFileText } from 'react-icons/lu';
import LegalPageLayout from '@/components/shared/LegalPageLayout';

export const metadata: Metadata = {
    title: "Terms & Conditions",
    description: "Read the Terms & Conditions for using Anandabazar BDMart's online marketplace and shopping services in Bangladesh.",
    alternates: { canonical: "/terms" },
};

export default function TermsPage() {
    return (
        <LegalPageLayout
            slug="terms"
            fallbackTitle="Terms & Conditions"
            icon={<LuFileText size={24} />}
            accentColor="var(--color-primary)"
            ctaTitle="Have questions about these terms?"
            ctaDescription="Our team is happy to help clarify anything."
            ctaButtonText="Contact Us"
        />
    );
}
