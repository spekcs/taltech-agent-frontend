SPECS

Agent processes raw documents programmatically and creates plaintext chunks.

Chunks are passed to an LLM where they are vectorized. 

Chat

User can prompt the agent with questions. On the background a semantic search is ran, this is passed with prompt to an LLM

“User questions”: [“What do motors do?”]
 -> Vectorize
-> DB search
 -> Prompt LLM 
“relevant_paragraphs”: [] 
“user_questions”: [“What do motors do?”]
“additional_prompts”: “If no relevant answer exists answer with general knowledge and give sources”
-> Display result

Categorization

We want for the user to be able to request topic pages, with relevant reading material. The material should include the topic title and subtopics with links to the source.

As assets are added to courses they are processed into chunks. LLM is prompted to create categories for all of the chunks and they are limited to a set max limit of categories.

EDIT: Try to categorize pages too, to lose the problem of too granular output to the user

Approach 
At first AI will try its best to create categories from the entire pdf. Then it will chunk the pdf and before embedding, it will add three best categories to the chunk. 

Quiz

User selects a topic and prompts AI for quiz. The context uses relevant chunks with said topic. 10 küsimust hardcoded

Every time a user receives new questions.  Based on quiz results we recommend to the user their weak points and create learning plans with that. Topics receive a metric based on successful answering. 

Based on answer success rate we save the latest average result that decays with each day. 

Video

We need to speech to text

Open API docs 
