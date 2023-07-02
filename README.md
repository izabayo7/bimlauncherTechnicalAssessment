[![Google Slides](https://www.gstatic.com/images/branding/product/1x/slides_2020q4_48dp.png) PRESENTAITION](https://docs.google.com/presentation/d/12c0UW92ZkIfzz-9LuHwyAzq368XPctTgGNCEdNzgZQk/edit?usp=sharing)

# Transfer documents between 2 Aconex projects

This is a solution to the problem of transferring documents between two projects in Aconex, an online collaboration platform for managing construction projects. The solution is implemented in TypeScript and uses Node.js runtime. It includes integration tests to ensure successful transfers.

## Prerequisites

To run this solution, you need to have the following installed:

- Node.js v18.x or later
- npm or yarn (preferred) package manager

## Getting Started

Follow the steps below to build and run the solution:

1. Clone the repository: `git clone <repository-url>`
<!-- if one want's to install it locall do the things below or if you want to use docker do this -->

### if you want to run it normally
2. Install the dependencies: `yarn install` or `npm install`
3. Update the `main.ts` file with your Aconex project IDs and document filenames if necessary.
5. Run the solution: `yarn start` or `npm start`

### if you want to run it with docker
2. Build the docker image: `docker-compose build`
3. Run the container `docker-compose up`

The solution will perform the following steps:

1. Upload 3 documents to the source project specified in `sourceProjectId`:
   - Generate XML data for each document using the project schema.
   - Upload the documents to the source project using the Aconex API.
   - Wait for a brief delay to allow the documents to be processed. [This is because of perfomance throttling](https://help.aconex.com/DisplayContent/aconex-web-services-performance-throttling) 
   - Retrieve the documents from the source project to verify successful upload.
2. Transfer the uploaded documents from the source project to the destination project specified in `destinationProjectId`.
   - Wait for a brief delay to allow the documents to be transferred.
   - Retrieve the documents from the destination project to verify successful transfer.
   - Check if each document in the destination project exists in the source project.
3. Upload a newer version of the first document in the source project:
   - Generate updated XML data for the document, removing the "DocumentNumber" field.
   - Upload the updated document to the source project using the Aconex API.
   - Wait for a brief delay to allow the document to be processed.
   - Retrieve the documents with the same document number from the source project to verify successful supersede.
   - Check if the first document in the source project has been successfully superseded.
   - This proves that my solution supports multi-version documents

## Notes

- The Aconex support team confirmed that direct document transfer between projects is not possible, so the solution downloads the documents from the source project and uploads them to the destination project.
- The solution uses the `axios` library for making HTTP requests to the Aconex API.
- The `xml2js` and `xmlbuilder2` libraries are used for parsing and generating XML data.
- The `@faker-js/faker` library is used for generating random data.
- The `ts-node` package is used to execute the TypeScript code directly.

## Conclusion

This solution demonstrates how to transfer documents between two Aconex projects programmatically. It provides a clear README.md file with instructions for building and running the solution. It also highlights important considerations, such as project configurations and unique document numbers, which must be taken into account when working with the Aconex API.

By following the provided instructions, you should be able to successfully build and run the solution, and verify the document transfers between projects.