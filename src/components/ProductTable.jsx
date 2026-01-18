import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Button,
  Text,
  Box,
} from '@chakra-ui/react';

export default function ProductTable({ products, onInc, onDec, onDelete, loading }) {
  if (loading) {
    return <Text>Loading products...</Text>;
  }

  if (!products || products.length === 0) {
    return <Text>No products available.</Text>;
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Product</Th>
            <Th>Stock</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((p) => (
            <Tr key={p.id}>
              <Td maxW="200px" isTruncated>{p.id}</Td>
              <Td>{p.name}</Td>
              <Td>{p.stock}</Td>
              <Td>
                <HStack spacing={2}>
                  <Button size="sm" colorScheme="green" onClick={() => onInc(p.id)}>+1</Button>
                  <Button size="sm" colorScheme="red" onClick={() => onDec(p.id)} isDisabled={p.stock <= 0}>-1</Button>
                  <Button size="sm" colorScheme="gray" onClick={() => onDelete(p.id)}>Delete</Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}