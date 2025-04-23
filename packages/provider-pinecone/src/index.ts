import { Pinecone } from '@pinecone-database/pinecone';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Options for uploading to Pinecone
 */
export interface PineconeOptions {
  /** Pinecone API key */
  apiKey: string;
  /** Pinecone environment */
  environment: string;
  /** Pinecone index name */
  indexName: string;
  /** Pinecone namespace (optional) */
  namespace?: string;
  /** Function to convert markdown to embeddings */
  embeddingFunction: (text: string) => Promise<number[]>;
  /** Optional function to extract metadata from markdown */
  metadataFunction?: (content: string, filePath: string) => Record<string, any>;
  /** Optional batch size for uploads */
  batchSize?: number;
}

/**
 * Upload markdown files to Pinecone
 */
export async function uploadToPinecone(
  markdownPaths: string[], 
  options: PineconeOptions
): Promise<void> {
  // Initialize Pinecone client
  const pinecone = new Pinecone({
    apiKey: options.apiKey,
    environment: options.environment,
  });
  
  // Get the index
  const index = pinecone.index(options.indexName);
  
  // Process files in batches
  const batchSize = options.batchSize || 10;
  const batches: Array<Array<{ id: string; content: string; path: string }>> = [];
  
  // Read all files
  const files = markdownPaths.map(filePath => ({
    id: path.basename(filePath, path.extname(filePath)),
    content: fs.readFileSync(filePath, 'utf8'),
    path: filePath
  }));
  
  // Create batches
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }
  
  // Process each batch
  for (const batch of batches) {
    const vectors = await Promise.all(
      batch.map(async file => {
        // Generate embedding
        const embedding = await options.embeddingFunction(file.content);
        
        // Generate metadata
        const metadata = options.metadataFunction ? 
          options.metadataFunction(file.content, file.path) : 
          { source: file.path };
          
        return {
          id: file.id,
          values: embedding,
          metadata
        };
      })
    );
    
    // Upload to Pinecone
    await index.upsert(vectors);
  }
}

/**
 * Delete vectors from Pinecone
 */
export async function deleteFromPinecone(
  ids: string[],
  options: Pick<PineconeOptions, 'apiKey' | 'environment' | 'indexName' | 'namespace'>
): Promise<void> {
  // Initialize Pinecone client
  const pinecone = new Pinecone({
    apiKey: options.apiKey,
    environment: options.environment,
  });
  
  // Get the index
  const index = pinecone.index(options.indexName);
  
  // Delete vectors
  await index.deleteMany(ids);
}

export default {
  uploadToPinecone,
  deleteFromPinecone
}; 