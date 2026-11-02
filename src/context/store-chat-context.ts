import { createContext } from 'react';
import type {ScanmsChatContextType} from '@/types/chat.types';

export const StoreChatContext = createContext<ScanmsChatContextType | undefined>(undefined);
