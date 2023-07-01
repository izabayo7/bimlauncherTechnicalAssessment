import axios from "axios";
import { faker } from "@faker-js/faker";
import { RegisterSchema, Document, DownloadResult, SearchResponse } from "./types";
import { convert, create } from "xmlbuilder2";
import { parseString } from "xml2js";
import { promisify } from "util";

// Constants
const userName = "poleary";
const password = "Auth3nt1c";
const parseStringPromise = promisify(parseString);

// Generate project base code
const projectBaseCode = `bimlauncherAssignment-${
  // today's date in format YYYYMMDD
  new Date().toISOString().split("T")[0].replace(/-/g, "")
}-${
    faker.number.int({ min: 1000, max: 9999 })
}`;

console.log(`projectBaseCode: ${projectBaseCode}`);

// set axios Authorization header
axios.defaults.headers.common["Authorization"] = `Basic ${Buffer.from(
  `${userName}:${password}`
).toString("base64")}`;

// set axios base url
axios.defaults.baseURL = "https://ea1.aconex.com/api";

// Cache for project schemas
const projectSchemaCache: { [key: string]: RegisterSchema } = {};

/**
 * Parses the RegisterSchema XML and returns a RegisterSchema object
 * @param json 
 */
export function parseRegisterSchema(json: string): any {
  const data = JSON.parse(json);

  const registerSchema: RegisterSchema = {
    projectWideAutoNumberingEnabled:
      data.RegisterSchema.$.projectWideAutoNumberingEnabled === "true",
    projectName: data.RegisterSchema.$.projectName,
    projectId: parseInt(data.RegisterSchema.$.projectId),
    basicAutoNumberingEnabled:
      data.RegisterSchema.$.basicAutoNumberingEnabled === "true",
    autoNumberingEnabled: data.RegisterSchema.$.autoNumberingEnabled === "true",
    EntityCreationSchemaFields:
      data.RegisterSchema.EntityCreationSchemaFields.map((field: any) => {
        const singleValueSchemaFields = field.SingleValueSchemaField.map(
          (singleField: any) => {
            return {
              Attributes: {
                EntityField: {
                  MandatoryStatus:
                    singleField.Attributes[0].EntityField[0].$.MandatoryStatus,
                },
              },
              DataType: singleField.DataType[0],
              FieldName: singleField.FieldName[0],
              Identifier: singleField.Identifier[0],
              ModifiedFieldName: singleField.ModifiedFieldName,
            };
          }
        );

        const multiValueSchemaFields = field.MultiValueSchemaField.map(
          (multiField: any) => {
            const schemaValues = multiField.SchemaValues
              ? multiField.SchemaValues[0].SchemaValue.map(
                  (schemaValue: any) => {
                    return {
                      AutoNumberScheme: schemaValue.AutoNumberScheme,
                      Id: schemaValue.Id,
                      Value: schemaValue.Value[0],
                    };
                  }
                )
              : undefined;

            return {
              Attributes: {
                EntityField: {
                  MandatoryStatus:
                    multiField.Attributes[0].EntityField[0].$.MandatoryStatus,
                },
              },
              DataType: multiField.DataType[0],
              FieldName: multiField.FieldName[0],
              Identifier: multiField.Identifier[0],
              ModifiedFieldName: multiField.ModifiedFieldName,
              SchemaValues: schemaValues,
            };
          }
        );

        return {
          SingleValueSchemaField: singleValueSchemaFields,
          MultiValueSchemaField: multiValueSchemaFields,
        };
      }),
  };

  return registerSchema;
}

/**
 *  Creates a document
 * @param postXML 
 * @param url 
 * @param fileData 
 */
export async function uploadDocument(
  postXML: string,
  url: string,
  fileData: { filename: string; fileContents: string }
){
  try {
    const boundary = "testboundary";

    const body = `
--${boundary}

${postXML}

--${boundary}

X-Filename: ${fileData.filename}

${fileData.fileContents}

--${boundary}--`;

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": `multipart/mixed; boundary=${boundary}`,
      },
    });

    return response.data;
  } catch (e: any) {
    if (e.response) {
      console.error(e.response.data);
    } else {
      console.error(e);
    }
  }
};

/**
 * 
 * @param projectId 
 * @param documentId 
 */
export async function downloadDocument(
  projectId: string,
  documentId: string
): Promise<DownloadResult>{
  const response = await axios.get(
    `/projects/${projectId}/register/${documentId}`
  );

  const filename = response.headers["content-disposition"]
    .split("=")[1]
    .split(";")[0]
    .replace(/"/g, "");

  // fs.writeFileSync(`./downloads/${filename}`, response.data);
  return {
    data: response.data,
    filename,
  };
};

/**
 * Fetch documents from a project
 * @param projectId 
 * @param query 
 */
export async function getDocuments(
  projectId: string,
  query = projectBaseCode
): Promise<Document[]> {

  const response = await axios.get(
    `/projects/${projectId}/register?return_fields=title,docno,statusid,doctype,doctype,filename,revision,discipline&search_query=${query}`
  );
  await sleep(2000);
  const parsedObject: SearchResponse = (await parseStringPromise(
    response.data
  )) as SearchResponse;

  let projectSchema:any = await getProjectSchema(projectId);

  const documentData = parsedObject.RegisterSearch.SearchResults[0].Document || [];

  // Create an array of Document objects
  const documents: Document[] = [];
  documentData.map((data: any) =>
    documents.push({
      DocumentId: data.$.DocumentId,
      DocumentNumber: data.DocumentNumber[0],
      DocumentTypeId: findIdFromValue(
        projectSchema.EntityCreationSchemaFields[0].MultiValueSchemaField,
        "DocumentTypeId",
        data.DocumentType[0]
      ),
      Revision: data.Revision[0],
      DocumentStatusId: findIdFromValue(
        projectSchema.EntityCreationSchemaFields[0].MultiValueSchemaField,
        "DocumentStatusId",
        data.DocumentStatus[0]
      ),
      HasFile: data.Filename[0].length ? true : false,
      Title: data.Title[0],
      Discipline:
        data.Discipline && data.Discipline[0].length
          ? data.Discipline[0]
          : undefined,
      Filename: data.Filename[0],
    })
  );
  return documents;
};

/**
 * Move documents from one project to another
 * @param sourceProjectId 
 * @param destinationProjectId 
 */
export async function transferDocuments(
  sourceProjectId: string,
  destinationProjectId: string
): Promise<Document[]>{
  
  const sourceDocuments = await getDocuments(sourceProjectId);
  const destinationDocuments = await getDocuments(destinationProjectId);

  // filter out documents that already exist in destination project
  const filteredDocuments = sourceDocuments.filter((sourceDocument) => {
    return !destinationDocuments.some((destinationDocument) => {
      return (
        sourceDocument.DocumentNumber === destinationDocument.DocumentNumber
      );
    });
  });

  const registerSchema = await getProjectSchema(destinationProjectId);

  // generate a random document
  const randomDoc = generateXML(registerSchema);

  for (const document of filteredDocuments) {
    const downloadResult = await downloadDocument(
      sourceProjectId,
      document.DocumentId
    );

    await sleep(1000);

    const updatedXml = updateXMLWithDocument(randomDoc, document);

    uploadDocument(
      updatedXml,
      `/projects/${destinationProjectId}/register`,
      {
        filename: downloadResult.filename,
        fileContents: Buffer.from(downloadResult.data).toString("base64"),
      }
    );
    console.log(`Document ${document.DocumentNumber} transferred to ${destinationProjectId}`);

    await sleep(2000);
  };

  return filteredDocuments;
};

/**
 * Filter out non-mandatory fields from EntityCreationSchemaFields
 * @param fields 
 */
export function findMandatoryFields(fields: any) {
  return fields.filter((field: any) => {
    const mandatoryStatus =
      field.Attributes[0].EntityField[0].$.MandatoryStatus;
    return mandatoryStatus === "MANDATORY";
  });
}

/**
 * Generate a random document based on the schema of a project
 * @param schema 
 */
export function generateXML(schema: any) {
  const root = create().ele("Document");
  schema.EntityCreationSchemaFields[0].SingleValueSchemaField.forEach(
    (singleField: any) => {
      const fieldName = singleField.FieldName;
      const identifier = singleField.Identifier;

      if (fieldName && identifier) {
        root
          .ele(identifier)
          .txt(
            identifier === "DocumentNumber"
              ? `${projectBaseCode}-${faker.string.uuid()}`
              : identifier === "HasFile" ? "true" 
              : identifier === "Revision" ? faker.number.int({min: 1, max: 10}).toString() 
              :identifier.toLowerCase().includes("date")
              ? faker.date.past().toISOString()
              : faker.commerce.productName()
          );
      }
    }
  );

  schema.EntityCreationSchemaFields[0].MultiValueSchemaField.forEach(
    (multiField: any) => {
      const typeField = multiField.FieldName;
      const typeIdentifier = multiField.Identifier;

      if (typeField && typeIdentifier) {
        const schemaValues = multiField.SchemaValues;
        const randomIndex = faker.number.int({
          min: 0,
          max: schemaValues.length - 1,
        });
        const selectedValue = schemaValues[randomIndex];

        if (selectedValue && selectedValue.Value) {
          root.ele(typeIdentifier).txt(selectedValue.Id || selectedValue.Value);
        }
      }
    }
  );

  const xml = root.end({ prettyPrint: true });
  return xml;
}

/**
 * Fetch the schema of a project
 * @param projectId 
 */
export async function getProjectSchema(projectId: string): Promise<RegisterSchema> {

    if (projectSchemaCache[projectId])
        return projectSchemaCache[projectId];

  const response = await axios.get(
    `/projects/${projectId}/register/schema`
  );
  const parsedObject: any = await parseStringPromise(response.data);
  const filteredResult = {
    RegisterSchema: {
      $: parsedObject.RegisterSchema.$,
      EntityCreationSchemaFields: [
        {
          SingleValueSchemaField: findMandatoryFields(
            parsedObject.RegisterSchema.EntityCreationSchemaFields[0]
              .SingleValueSchemaField
          ),
          MultiValueSchemaField: findMandatoryFields(
            parsedObject.RegisterSchema.EntityCreationSchemaFields[0]
              .MultiValueSchemaField
          ),
        },
      ],
    },
  };

  const registerSchema = parseRegisterSchema(JSON.stringify(filteredResult));
  
  projectSchemaCache[projectId] = registerSchema;
  
  return registerSchema;
};

/**
 * Construct a document object from XML and a document
 * @param xml 
 * @param document 
 */
export function updateXMLWithDocument(xml: string, document: any) {
  const updatedRoot :any = convert(xml, { format: "object" });

  Object.keys(updatedRoot.Document).forEach((key: any) => {
    const fieldValue = document[key];

    if (fieldValue !== undefined && fieldValue !== null) {
      updatedRoot.Document[key] = fieldValue;
    }
  });

  const updatedXml = convert(updatedRoot, { format: "xml", prettyPrint: true });
  return updatedXml;
}

/**
 * Remove a list of fields from XML
 * @param xml 
 * @param fields 
 */
export function removeFieldsFromXML(xml: string, fields: string[]) {
    const updatedRoot :any = convert(xml, { format: "object" });
    
    fields.forEach((field) => {
        delete updatedRoot.Document[field];
    });
    
    const updatedXml = convert(updatedRoot, { format: "xml", prettyPrint: true });
    return updatedXml;
}

/**
 * Find the Id using the value of a field
 * @param schema 
 * @param field 
 * @param value 
 */
export function findIdFromValue(
  schema: any,
  field: string,
  value: string
): number {
  const multiValueField = schema.find(
    (fieldSchema: any) => fieldSchema.Identifier === field
  );

  if (multiValueField) {
    const schemaValue = multiValueField.SchemaValues.find(
      (schemaValue: any) => schemaValue.Value === value
    );
    if (schemaValue) {
      return schemaValue.Id || schemaValue.Value;
    }
  }
  return 0;
}

/**
 * Sleep for a number of milliseconds
 * @param ms 
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}