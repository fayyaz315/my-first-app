import { Card, Thumbnail, BlockStack, Text } from '@shopify/polaris'

export function ProductCard({ product }) {
  const image = product.featuredImage

  return (
    <Card>
      <BlockStack gap="300" padding="400">
        <Text as="h2" variant="headingSm">
          {product.title}
        </Text>

        {image && (
          <Thumbnail
            source={image.url}
            alt={image.altText || product.title}
            size="large"
          />
        )}

        <Text as="p" variant="bodyMd">
          {product.description}
        </Text>

        <Text as="p" variant="bodyMd">
          <strong>Price:</strong> ${product.variants.edges[0].node.price}
        </Text>
      </BlockStack>
    </Card>
  )
}
