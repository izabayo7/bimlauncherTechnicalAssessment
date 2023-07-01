import { generateXML, getDocuments, getProjectSchema, removeFieldsFromXML, sleep, transferDocuments, updateXMLWithDocument, uploadDocument } from "./utils/imports";



const Solution = async () => {
  const sourceProjectId = "1879048422"; // Breeze Tower Phase3
  const destinationProjectId = "1879048400"; // Hotel VIP Resort

  // upload 3 documents to source project
  const filesToUpload = ["document.txt", "blank.pdf", "Empty.png"];
  let sourceRegisterSchema = await getProjectSchema(sourceProjectId);

  for (const filename of filesToUpload) {
    let randomDoc = generateXML(sourceRegisterSchema);
    
    await uploadDocument(
      randomDoc,
      `/projects/${sourceProjectId}/register`,
      {
        filename,
        fileContents: Buffer.from(`./files/${filename}`).toString("base64"),
      }
    );
    console.log(`Uploaded ${filename}`)
  }

  // add a delay to allow the documents to be processed
  await sleep(2000);

  const sourceDocuments = await getDocuments(sourceProjectId);

  if (sourceDocuments.length !== 3) {
    throw new Error("Documents not uploaded to source project");
  } else {
    console.log("All 3 documents were successfully uploaded to source project");
  }


  // transfer documents from source project to destination project

  await transferDocuments(sourceProjectId, destinationProjectId);

  await sleep(5000);

  const destinationDocuments = await getDocuments(destinationProjectId);

  if (destinationDocuments.length !== 3) {
    throw new Error("Documents not uploaded to destination project");
  } else {
    console.log("All 3 documents were successfully uploaded to destination project");
  }

  for (const document of destinationDocuments) {
    const sourceDocument = sourceDocuments.find((doc) => doc.DocumentNumber === document.DocumentNumber);
    if (!sourceDocument) {
      throw new Error("Document not found in source project");
    }
  }

  console.log("All documents were successfully transferred from source project to destination project");

  await sleep(2000);

  // upload a newer version of the first document in source project

  const firstDocument = sourceDocuments[0];

  let updatedXml = updateXMLWithDocument(
    generateXML(sourceRegisterSchema),
    firstDocument
  );
  updatedXml =  removeFieldsFromXML(updatedXml, ["DocumentNumber"]);

  await uploadDocument(
    updatedXml,
    `/projects/${sourceProjectId}/register/${firstDocument.DocumentId}/supersede`,
    {
      filename: "editedDocument.txt",
      fileContents: Buffer.from(`./files/editedDocument.txt`).toString(
        "base64"
      ),
    }
  );

  await sleep(2000);

  // check if the documents in source project with docno of the first document is two

  const updatedSourceDocuments = await getDocuments(sourceProjectId, firstDocument.DocumentNumber);

  if (updatedSourceDocuments[0].Filename !== "editedDocument.txt") {
    throw new Error("Document not superseded");
  } else {
    console.log("Document was successfully superseded");
  }
}

Solution();