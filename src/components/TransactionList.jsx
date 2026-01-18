import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { formatDate } from '../../utils/format';

export default function TransactionList({ transactions, loading }) {
  if (loading) {
    return <Flex justify="center" py={6}><Spinner /></Flex>;
  }

  if (!transactions || transactions.length === 0) {
    return <Text>No transactions yet.</Text>;
  }

  return (
    <Table size="sm" variant="striped">
      <Thead>
        <Tr>
          <Th>Time</Th>
          <Th>Product</Th>
          <Th>Change</Th>
        </Tr>
      </Thead>
      <Tbody>
        {transactions.map((trx) => (
          <Tr key={trx.id}>
            <Td>{formatDate(trx.time)}</Td>
            <Td>{trx.product_name}</Td>
            <Td>{trx.delta > 0 ? `+${trx.delta}` : trx.delta}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}