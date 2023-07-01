# Transfer documents between 2 Aconex projects

This is a solution to the problem of transferring documents between two projects in Aconex, an online collaboration platform for managing construction projects. The solution is implemented in TypeScript and uses Node.js runtime. It includes integration tests to ensure successful transfers.

## Prerequisites

To run this solution, you need to have the following installed:

- Node.js v18.x or later
- npm or yarn (preferred) package manager

## Getting Started

Follow the steps below to build and run the solution:

1. Clone the repository: `git clone <repository-url>`
2. Install the dependencies: `yarn install` or `npm install`
3. Update the `main.ts` file with your Aconex project IDs and document filenames if necessary.
5. Run the solution: `yarn start` or `npm start`

The solution will perform the following steps:

1. Upload 3 documents to the source project specified in `sourceProjectId`:
   - Generate XML data for each document using the project schema.
   - Upload the documents to the source project using the Aconex API.
2. Wait for a brief delay to allow the documents to be processed. 
3. Retrieve the documents from the source project to verify successful upload.[This is because of perfomance throttling](https://help.aconex.com/DisplayContent/aconex-web-services-performance-throttling)
4. Transfer the uploaded documents from the source project to the destination project specified in `destinationProjectId`.
5. Wait for a brief delay to allow the documents to be transferred.
6. Retrieve the documents from the destination project to verify successful transfer.
7. Check if each document in the destination project exists in the source project.
8. Upload a newer version of the first document in the source project:
   - Generate updated XML data for the document, removing the "DocumentNumber" field.
   - Upload the updated document to the source project using the Aconex API.
- This proves that my solution supports multi-version documents
9. Wait for a brief delay to allow the document to be processed.
10. Retrieve the documents with the same document number from the source project to verify successful supersede.
11. Check if the first document in the source project has been successfully superseded.

## Notes

- The Aconex support team confirmed that direct document transfer between projects is not possible, so the solution downloads the documents from the source project and uploads them to the destination project.
- The solution uses the `axios` library for making HTTP requests to the Aconex API.
- The `xml2js` and `xmlbuilder2` libraries are used for parsing and generating XML data.
- The `@faker-js/faker` library is used for generating random data.
- The `ts-node` package is used to execute the TypeScript code directly.

## Conclusion

This solution demonstrates how to transfer documents between two Aconex projects programmatically. It provides a clear README.md file with instructions for building and running the solution. It also highlights important considerations, such as project configurations and unique document numbers, which must be taken into account when working with the Aconex API.

By following the provided instructions, you should be able to successfully build and run the solution, and verify the document transfers between projects.