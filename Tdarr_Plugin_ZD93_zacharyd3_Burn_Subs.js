function details() {
  return {
    id: "Tdarr_Plugin_ZD93_zacharyd3_Burn_Subs",
	Stage: "Pre-processing",
    Name: "zacharyd3 - Burn in forced subtitles",
    Type: "Video",
    Operation:"Transcode",
    Description: `Searches all videos for a forced subtitle stream and if it finds one, burns it into the video file. \n\n This must be run BEFORE any video transcoding, including H265.`,
    Version: "1.1",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_Migz1FFMPEG_CPU.js",
    Tags:'pre-processing,ffmpeg,subtitles only',
  }
}

function plugin(file, librarySettings, inputs) {
  var response = {
    processFile: false,
    preset: '',
	container: '.' + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  }

  if (file.fileMedium !== "video") {
      console.log("File is not video")
      response.infoLog += "☒ File is not video \n"
      response.processFile = false;
      return response
    }
  
  var ffmpegCommandInsert = ''
  var subtitleIdx = -1
  var convert = false
  
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
	   try {
            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
                subtitleIdx++
            }
	    } catch (err) { }

		try {
			//Setup the stream check and variables
			if (file.ffProbeData.streams[i].disposition.forced == '1'){
				var isForced = true
			}
			if (file.ffProbeData.streams[i].disposition.forced != '1'){
				var isForced = false
			}
			
			//-i input.mkv -filter_complex "[0:v][0:s]overlay[v]" -map "[v]" -map 0:a <output options> output.mkv
					
			if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle" && isForced == true){
				//ffmpegCommandInsert += `-filter_complex "[0:v][0:s:${subtitleIdx}]overlay[v]" -map "[v] -map 0:a" `
				ffmpegCommandInsert += `-vf subtitles="${file.file}: si=${subtitleIdx}" -crf 16 -c:a copy`
				response.infoLog += `☑ Subtitle stream detected as forced, burning them in. Subtitle stream 0:s:${subtitleIdx} - ${file.ffProbeData.streams[i].tags.language.toLowerCase()} \n`
				response.infoLog += `\n`		
				convert = true						
			}
		} catch (err) { } 
	}
		
  if (convert === true ) {
      response.processFile = true;
      response.preset = `, ${ffmpegCommandInsert}`
      response.container = '.' + file.container
      response.reQueueAfter = false;
    } else {
      response.processFile = false;
	  response.infoLog += "☑ File doesn't contain forced subtitle tracks.\n"
    }
      return response
}
module.exports.details = details;
module.exports.plugin = plugin;
