import type { MockProduct } from "@/data/mockData";

type ProductsResponse = {
  ok: boolean;
  database?: boolean;
  products?: MockProduct[];
  product?: MockProduct;
  deleted?: boolean;
};

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function fetchApiProducts(): Promise<MockProduct[] | undefined> {
  try {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) return undefined;
    const body = await readJson<ProductsResponse>(response);
    return body?.products;
  } catch {
    return undefined;
  }
}

export async function fetchApiProduct(id: string): Promise<MockProduct | null | undefined> {
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (response.status === 404) return null;
    if (!response.ok) return undefined;
    const body = await readJson<ProductsResponse>(response);
    return body?.product;
  } catch {
    return undefined;
  }
}

export async function createApiProduct(product: MockProduct): Promise<MockProduct | undefined> {
  try {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!response.ok) return undefined;
    const body = await readJson<ProductsResponse>(response);
    return body?.product;
  } catch {
    return undefined;
  }
}

export async function saveApiProduct(product: MockProduct): Promise<MockProduct | undefined> {
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(product.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!response.ok) return undefined;
    const body = await readJson<ProductsResponse>(response);
    return body?.product;
  } catch {
    return undefined;
  }
}

export async function deleteApiProduct(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) return false;
    const body = await readJson<ProductsResponse>(response);
    return Boolean(body?.ok && body.database !== false);
  } catch {
    return false;
  }
}
