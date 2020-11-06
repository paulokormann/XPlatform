
/**
 * Nome da primitiva : employeeSave
 * Nome do dominio : hcm
 * Nome do serviço : payroll
 * Nome do tenant : trn94657786
 **/

const axios = require('axios');

exports.handler = async event => {

    let body = parseBody(event);
    let tokenSeniorX = event.headers['X-Senior-Token'];

    const instance = axios.create({
        baseURL: 'https://platform-homologx.senior.com.br/t/senior.com.br/bridge/1.0/rest/',
        headers: {
          'Authorization': tokenSeniorX
        }
    });

     /* Não permite a troca de nome */
    if(body.sheetInitial.employee) {
        if(body.sheetInitial.person.name !== body.sheetInitial.employee.name){
            return sendRes(400,'Não é permitido alterar o nome do colaborador.'); 
        }
    }
    
    
    if(!body.sheetInitial.employee){
        // Não permitir realizar uma Admissão com o campo "Indicativo de Admissão" com o valor diferente de "Normal" 
        if(body.sheetContract.admissionOriginType.value !== 'Normal'){
             return sendRes(400,'Admitidos devem ter o Indicativo de Admissão como Normal. Verifique na aba Contrato.'); 
        }
        
         // Valida matrícula no cadastro inicial 
         if(!body.sheetContract.registernumber){
            return sendRes(400,'Informe a matrícula do colabordor (Aba Contrato).'); 
        }
    } 
        
        
     /* Valida código de Escalas para empregado */ 
     if((body.sheetInitial.contractType.key === 'Employee') && (body.sheetWorkSchedule.workshift.tableId)){
        try {
            let wshiftResp = await instance.get(`/hcm/payroll/entities/workshift/${body.sheetWorkSchedule.workshift.tableId}`);
            
            if((wshiftResp.data.code > 10) || (wshiftResp.data.workshiftType !== 'Permanent')) {
                return sendRes(400,'Escalas de empregados devem estar entre 1 e 10 e devem ser do tipo Permanente');
            }

        } catch (error) {
            return sendRes(400,error.message);
        }
    }

    /*Caso todas as validações passem, retorno OK*/
    return sendRes(200,body);
    
};



const parseBody = (event) => {
    return typeof event.body === 'string' ?  JSON.parse(event.body) : event.body || {};
};

const sendRes = (status, body) => {
    var response = {
      statusCode: status,
      headers: {
        "Content-Type": "application/json"
      },
      body: typeof body === 'string' ? body : JSON.stringify(body) 
    };
    return response;
};