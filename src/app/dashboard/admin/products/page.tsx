"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuPlus,
    LuSquarePen,
    LuTrash2,
    LuSearch,
    LuFilter,
    LuShoppingBag,
    LuEye,
    LuEllipsisVertical,
    LuBox,
    LuChartColumn,
    LuCloudUpload
} from 'react-icons/lu';
import {
    useGetProductsQuery,
    useDeleteProductMutation
} from '@/redux/api/productApi';
import { toast } from 'react-hot-toast';
import BulkUploadModal from './BulkUploadModal';

const ProductsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const { data: productsData, isLoading, refetch } = useGetProductsQuery({
        searchTerm: searchTerm || undefined,
        page: page,
        limit: 10
    });
    const [deleteProduct] = useDeleteProductMutation();

    const products = productsData?.data || [];
    const meta = productsData?.meta || {};

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id).unwrap();
                toast.success('Product deleted successfully');
            } catch (error: any) {
                toast.error(error?.data?.message || 'Failed to delete product');
            }
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-md border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Products Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your inventory, pricing and product visibility</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowBulkUpload(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <LuCloudUpload size={18} />
                        Bulk Upload (CSV)
                    </button>
                    <Link
                        href="/dashboard/admin/products/new"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white rounded-md font-semibold hover:bg-[#4338CA] transition-all shadow-md"
                    >
                        <LuPlus size={20} />
                        Add New Product
                    </Link>
                </div>
            </div>

            {showBulkUpload && <BulkUploadModal onClose={() => setShowBulkUpload(false)} />}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Products', value: meta.total || 0, icon: LuShoppingBag, color: 'blue' },
                    { label: 'Active', value: products.filter((p: any) => p.status === 'active').length, icon: LuBox, color: 'green' },
                    { label: 'Low Stock', value: products.filter((p: any) => p.quantity <= p.lowStockThreshold).length, icon: LuChartColumn, color: 'orange' },
                    { label: 'Featured', value: products.filter((p: any) => p.isFeatured).length, icon: LuEye, color: 'purple' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                        <div className={`w-12 h-12 rounded-lg bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">{stat.label}</p>
                            <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#4F46E5] focus:bg-white transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-all text-gray-600 shadow-sm bg-white">
                        <LuFilter size={18} />
                        Filter
                    </button>
                    <button onClick={() => refetch()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-all text-gray-600 shadow-sm bg-white">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-20 text-center text-gray-500">
                        <div className="animate-spin w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p>Loading products...</p>
                    </div>
                ) : products.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {products.map((product: any) => (
                                    <tr key={product._id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                    {product.thumbnail ? (
                                                        <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <LuShoppingBag size={22} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <p className="font-bold text-gray-800 truncate">{product.name}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 font-mono">SKU: {product.sku || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 font-medium">{product.category?.name || 'Uncategorized'}</p>
                                            {product.subCategory && (
                                                <p className="text-[11px] text-gray-400 mt-0.5">{product.subCategory?.name}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-800">{formatCurrency(product.price)}</p>
                                            {product.comparePrice > product.price && (
                                                <p className="text-xs text-red-500 line-through">{formatCurrency(product.comparePrice)}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <p className={`text-sm font-bold ${product.quantity <= product.lowStockThreshold ? 'text-red-500' : 'text-gray-700'}`}>
                                                    {product.quantity} units
                                                </p>
                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${product.quantity === 0 ? 'bg-red-500' :
                                                            product.quantity <= product.lowStockThreshold ? 'bg-orange-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, (product.quantity / 50) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase ${product.status === 'active' ? 'bg-green-100 text-green-700' :
                                                product.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/dashboard/admin/products/new?id=${product._id}`}
                                                    className="p-2 hover:bg-white hover:shadow-md rounded-md text-[#4F46E5] transition-all border border-transparent hover:border-gray-100"
                                                    title="Edit"
                                                >
                                                    <LuSquarePen size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="p-2 hover:bg-white hover:shadow-md rounded-md text-red-500 transition-all border border-transparent hover:border-gray-100"
                                                    title="Delete"
                                                >
                                                    <LuTrash2 size={18} />
                                                </button>
                                                <button className="p-2 hover:bg-white hover:shadow-md rounded-md text-gray-500 transition-all border border-transparent hover:border-gray-100">
                                                    <LuEllipsisVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-[var(--color-primary-lightest)] rounded-[24px] flex items-center justify-center mx-auto mb-4 ring-1 ring-[var(--color-primary-border)]">
                            <LuShoppingBag size={38} className="text-[var(--color-primary)]" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">No products found</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">Start adding products to your store to see them listed here.</p>
                        <Link
                            href="/dashboard/admin/products/new"
                            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-[#4F46E5] text-white rounded-md font-bold hover:bg-[#4338CA] transition-all shadow-md"
                        >
                            <LuPlus size={20} />
                            Add Your First Product
                        </Link>
                    </div>
                )}

                {/* Pagination */}
                {meta.pages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-bold text-gray-800">{(page - 1) * 10 + 1}</span> to <span className="font-bold text-gray-800">{Math.min(page * 10, meta.total)}</span> of <span className="font-bold text-gray-800">{meta.total}</span> products
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page === meta.pages}
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;
