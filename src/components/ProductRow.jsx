import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
} from '@chakra-ui/react';
import { CiCircleMinus, CiCirclePlus } from 'react-icons/ci';
import '../styles/products-page.css';

export default function ProductRow({ product, pending, onChangeDelta }) {
  const [qty, setQty] = useState(1);
  const inputRef = useRef(null);

  // Reset qty when product changes to avoid stale values (useful with filtering/virtual lists)
  useEffect(() => {
    // only reset if input not focused to avoid interrupting user typing
    if (document.activeElement !== inputRef.current) {
      setQty(1);
    }
  }, [product.id]);

  const commitDelta = (sign = 1) => {
    const n = Number(qty) || 0;
    if (!Number.isFinite(n) || n <= 0) return;
    onChangeDelta(product.id, sign * Math.floor(n));
  };

  return (
    <tr key={product.id}>
      <td>{product.name}</td>
      <td>{product.productId}</td>
      <td>{product.supplierName}</td>
      <td>{product.category}</td>
      <td>IDR {product.price} K</td>
      <td>{product.stock}</td>
      <td className="actions center stock-actions">
        <HStack spacing={2} align="center">
          <IconButton
            className="icon-btn"
            aria-label="Decrease stock"
            icon={<CiCircleMinus size={20} />}
            onClick={() => commitDelta(-1)}
            isDisabled={Boolean(pending) || product.stock <= 0}
            size="sm"
          />

          <NumberInput
            value={qty}
            onChange={(v) => setQty(v)}
            min={1}
            max={999}
            width="65px"
            size="sm"
            clampValueOnBlur={true}
          >
            <NumberInputField
              ref={inputRef}
              aria-label="Quantity to adjust"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // default commit as increment on Enter
                  commitDelta(1);
                }
              }}
            />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>

          <IconButton
            className="icon-btn"
            aria-label="Increase stock"
            icon={<CiCirclePlus size={20} />}
            onClick={() => commitDelta(1)}
            isDisabled={Boolean(pending)}
            size="sm"
          />
        </HStack>
      </td>
    </tr>
  );
}