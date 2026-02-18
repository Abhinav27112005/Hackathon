# Setting Up Atlas Vector Search for Gemini (3072 Dimensions)

Your current error (`indexed with 768 dimensions but queried with 3072`) happens because your MongoDB Atlas Search Index was configured for OpenAI (768 dims) but Gemini embeddings use **3072 dimensions**.

## Steps to Fix

1. **Login to MongoDB Atlas**
   - Go to [cloud.mongodb.com](https://cloud.mongodb.com)
   - Navigate to your project and cluster.

2. **Go to "Atlas Search" Tab**
   - Click on your cluster name.
   - Click the **"Atlas Search"** tab (next to "Collections").

3. **Edit the Index via JSON Editor**
   - Find your index named `vector_index`.
   - Click the **"..."** button → **Edit**.
   - **Important:** Select **"JSON Editor"** (not the Visual Editor).

4. **Paste This Configuration**
   Replace the *entire* content with this JSON:

   ```json
   {
     "fields": [
       {
         "numDimensions": 3072,
         "path": "embedding",
         "similarity": "cosine",
         "type": "vector"
       },
       {
         "path": "schemeId",
         "type": "filter"
       }
     ]
   }
   ```
   *(Note: The key change is `numDimensions: 3072`)*

5. **Save Changes**
   - Click "Save Changes".
   - Wait for the status to change from "Building" to "Active" (takes 1-2 minutes).

## Verification
Once the index is Active:
1. Restart your backend.
2. Run an eligibility check.
3. Check logs—you should see `🔎 Attempting Atlas Vector Search...` followed by specific results (no "fallback" warning).
