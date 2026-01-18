import React from 'react';
import {
  Stack,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from '@chakra-ui/react';
import { validateProduct } from '../../utils/validators';

export default function ProductForm({ name, stock, setName, setStock, onSubmit, submitting }) {
  const errors = validateProduct({ name, stock });

  return (
    <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
      <FormControl isInvalid={!!errors.name}>
        <FormLabel srOnly>Product Name</FormLabel>
        <Input
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Product name"
        />
        {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
      </FormControl>

      <FormControl isInvalid={!!errors.stock} width={{ base: '100%', md: '160px' }}>
        <FormLabel srOnly>Stock</FormLabel>
        <Input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          min={0}
          aria-label="Initial stock"
        />
        {errors.stock && <FormErrorMessage>{errors.stock}</FormErrorMessage>}
      </FormControl>

      <Button colorScheme="teal" px={8} onClick={onSubmit} isLoading={submitting}>
        Add Product
      </Button>
    </Stack>
  );
}