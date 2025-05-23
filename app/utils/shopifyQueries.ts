import { authenticate } from '../shopify.server'

export const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          descriptionHtml
          featuredImage {
            url
            altText
          }
          variants(first: 1) {
            edges {
              node {
                id
                price
              }
            }
          }
        }
      }
    }
  }
`



export async function getProducts(request: Request) {
  const { admin } = await authenticate.admin(request)

  const response = await admin.graphql(GET_PRODUCTS_QUERY, {
    variables: { first: 20 }
  })

  const json = await response.json()
  const products = json?.data?.products?.edges?.map((edge: any) => edge.node) || []
  console.log('Products:', products)
  return products
}


export const CREATE_PRODUCT_MUTATION = `
  mutation createProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`



export const PRODUCT_UPDATE_MUTATION = `
  mutation updateProduct($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        descriptionHtml
      }
      userErrors {
        field
        message
      }
    }
  }
`
