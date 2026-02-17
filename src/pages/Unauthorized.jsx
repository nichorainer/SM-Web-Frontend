import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { LockIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Unauthorized() {
  return (
     <Box display="flex" minH="100vh" bg="gray.50">
      {/* Sidebar */}
      <Sidebar />
        <Box
            flex="1"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="gray.50"
            px={4}
        >
            <VStack spacing={6} textAlign="center">
                <HStack spacing={3}>
                    <Icon as={LockIcon} w={10} h={10} color="red.500" />
                    <Heading as="h1" size="2xl" color="red.500">
                        403 - Forbidden
                    </Heading>
                </HStack>
                <Heading as="h2" size="lg">
                    Unauthorized Access
                </Heading>
                <Text fontSize="md" color="gray.600" maxW="md">
                    You do not have permission to view this page. Please check your account
                    permissions or contact the owner if you believe this is an error.
                </Text>
                <Button
                    as={RouterLink}
                    to="/home"
                    colorScheme="purple"
                    size="lg"
                >
                    Back to Home
                </Button>
            </VStack>
        </Box>
    </Box>
  );
}