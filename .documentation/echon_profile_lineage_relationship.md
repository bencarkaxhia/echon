LINEAGE & RELATIONSHIP FIELDS
1. LINEAGE (paternal/maternal/both):
Purpose: Track which side of the family someone belongs to.
Example:
Your Space: "Çarkaxhia Family"

Members:
- You: lineage = "both" (founder, it's YOUR family)
- Your Dad: lineage = "paternal" (from father's side)
- Your Mom: lineage = "maternal" (from mother's side)  
- Your Wife: lineage = "both" (married in, part of both now)
- Your Kids: lineage = "both" (blood from both sides)
- Your Uncle (Dad's brother): lineage = "paternal"
- Your Aunt (Mom's sister): lineage = "maternal"
Why it matters:

Filter by "Show only paternal line"
Genealogy research
Cultural traditions (some families track paternal line more)


2. RELATIONSHIP_TO_FOUNDER:
This is a TEXT field, not the relationships table!
Purpose: Quick description for the space creator.
Example:
Space Founder: You (Beni)

Members:
- Dad: relationship_to_founder = "Father"
- Mom: relationship_to_founder = "Mother"
- Brother: relationship_to_founder = "Brother"
- Wife: relationship_to_founder = "Spouse"
- Son: relationship_to_founder = "Son"
- Uncle: relationship_to_founder = "Father's Brother"
This is just a LABEL, not the actual relationship graph!
The relationships table we built today is the REAL graph (parent/child/sibling connections).