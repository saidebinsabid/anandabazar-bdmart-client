import type { Metadata } from 'next';
import CategoryPage from '@/components/category/CategoryPage';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const pretty = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
        title: `${pretty} — Anandabazar BDMart`,
        description: `Shop ${pretty} on Anandabazar BDMart. Browse products, filter by price, rating and availability, sorted by best match.`,
        alternates: { canonical: `/category/${slug}` },
    };
}

export default async function CategoryRoutePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <CategoryPage slug={slug} />;
}
