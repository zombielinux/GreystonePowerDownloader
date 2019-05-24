const got = require('got');
const Influx = require('influx');
var secrets = require('./secrets.js')

var now = new Date()
var tzOffset = parseInt(now.getTimezoneOffset())/60

const influx = new Influx.InfluxDB({
  host: secrets.influxHost,
  database: secrets.influxDB,
  schema: [
    {
      measurement: 'greystoneMeasured',
      fields: { usage: Influx.FieldType.FLOAT},
      tags: ['account', 'unit', 'location']
    }
  ]
});

var newStart = process.argv
if (!newStart[2]) {
	var startDate = new Date()
//	console.log(startDate.getMonth()+"/"+startDate.getDate()+"/"+parseInt(startDate.getYear()+1900))
	startDate = startDate.getMonth()+"/"+startDate.getDate()+"/"+parseInt(startDate.getYear()+1900)
	}
else {
	newStart = newStart[2].split("-")
	startDate = newStart[1]+"/"+newStart[2]+"/"+newStart[0]
//	console.log(startDate)
}



for (h=0; h<7; h++){
	newStartDate = new Date(startDate.split("/")[2], startDate.split("/")[0], startDate.split("/")[1])
	newStartDate.setDate(newStartDate.getDate()-h)
	console.log(newStartDate)

	got('https://secure.greystonepower.com/oscp/customizations/MDM/ExportCSV.aspx?IsNew=Y&id=Interval&mbrsep=' + secrets.memberNumber + '&stdate=' + newStartDate.getMonth()+"/"+newStartDate.getDate()+"/"+parseInt(newStartDate.getYear()+1900) +'&interval=15&sliderval=0&meter=' + secrets.meterNumber + '&demandcode=00').then(response => { 
		console.log(response.body)
	//	console.log(typeof response.body.split(/\r?\n/))
		var entries = response.body.split(/\r?\n/)
		var keys = entries[0].split(",")
		for (i=0; i<keys.length; i++){
			keys[i] = keys[i].trim()
		}
		for (i=1; i<entries.length-1; i++){
			tempData = entries[i].split(",")
			for (j=0; j< tempData.length; j++){
				tempData[j] = tempData[j].trim()
			}
			date = tempData[2].split("/")
			time = tempData[3].split(":")
			minute = time[1].split(" ")
			if (minute[1] == "PM" && time[0] < 12) {
				time[0] = parseInt(time[0]) + 12
			}		
			var recordedTime = toTimestamp(tzOffset, date[2], date[0], date[1], time[0], minute[0])
	                influx.writePoints([{
	                        measurement: 'greystoneMeasured',
	                        fields: {usage: tempData[4]},
				timestamp: recordedTime,
	                        tags: {account: secrets.memberNumber, unit: secrets.meterNumber , location: "McCready"}
	                }], {
	                        database: secrets.influxDatabase,
	                        precision: 's',
	                });




		} 
	})
}
function toTimestamp(offset, year, month, day, hour, minute, second) {
	if (!second) { second = "00"}
//	console.log(year+"-"+month+"-"+day+"T"+hour+":"+minute+":"+second+"-"+("0"+offset).slice(-2)+":00")
	var timestamp = new Date(year+"-"+month+"-"+day+"T"+hour+":"+minute+":"+second+"-"+("0"+offset).slice(-2)+":00")
//	console.log(timestamp)
	return timestamp
}
