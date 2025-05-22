import { json, LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Page, Layout } from '@shopify/polaris'
import { getProducts } from '../utils/shopifyQueries'
import { ProductCard } from '../components/ProductCard'

export const loader: LoaderFunction = async ({ request }) => {
  const products = await getProducts(request)
  return json({ products })
}

export default function ProductsPage() {
  const { products } = useLoaderData<typeof loader>()

  return (
    <Page
      title="All Products"
      primaryAction={{
        content: 'Create Product',
        url: '/app/create-product',
      }}
    >
      <Layout>
        {products.map(product => (
          <Layout.Section key={product.id}>
            <ProductCard product={product} />
          </Layout.Section>
        ))}
      </Layout>
    </Page>
  )
}
