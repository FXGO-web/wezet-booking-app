import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Plus, Video, Package, PlayCircle, Loader2 } from "lucide-react";
import { productsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { ProductModal } from "./ProductModal";

interface ProductsOnDemandProps {
    onBack?: () => void;
}

export function ProductsOnDemand({ onBack }: ProductsOnDemandProps) {
    const { getAccessToken } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await productsAPI.getAll();
            if (data && data.content) {
                setProducts(data.content);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreate = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: any) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setIsModalOpen(false); // Close modal on success
        fetchProducts();
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            {onBack && (
                                <Button variant="ghost" size="sm" onClick={onBack}>
                                    ← Back
                                </Button>
                            )}
                            <h1 className="text-3xl font-bold">Products & On Demand</h1>
                        </div>
                        <p className="text-muted-foreground ml-20">
                            Manage your digital products and streaming content
                        </p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New
                    </Button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : products.length > 0 ? (
                        products.map((product) => (
                            <Card
                                key={product.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer group"
                                onClick={() => handleEdit(product)}
                            >
                                <CardHeader className="pb-4">
                                    <div className="h-48 w-full bg-muted rounded-lg mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors relative overflow-hidden">
                                        {product.type === 'video_course' ? (
                                            <Video className="h-12 w-12 text-muted-foreground" />
                                        ) : (
                                            <Package className="h-12 w-12 text-muted-foreground" />
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                            {product.type === 'video_course' ? (
                                                <PlayCircle className="h-3 w-3" />
                                            ) : (
                                                <Package className="h-3 w-3" />
                                            )}
                                            <span>{product.type === 'video_course' ? 'Video Course' : 'Digital Product'}</span>
                                        </div>
                                    </div>
                                    <CardTitle className="flex items-start justify-between">
                                        <span>{product.title}</span>
                                        <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded">
                                            {product.status || 'Active'}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>{product.description || 'No description'}</p>
                                        <div className="flex items-center gap-2 pt-2">
                                            <span className="font-medium text-foreground">€{product.price || 0}</span>
                                            <span>•</span>
                                            <span>{product.itemCount || 0} Items</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : null}

                    {/* Empty State / Create New Card */}
                    <Card
                        className="border-dashed flex flex-col items-center justify-center p-12 text-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={handleCreate}
                    >
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium">Add New Item</h3>
                            <p className="text-sm text-muted-foreground">
                                Create a product or upload content
                            </p>
                        </div>
                    </Card>
                </div>
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                product={selectedProduct}
            />
        </div>
    );
}
