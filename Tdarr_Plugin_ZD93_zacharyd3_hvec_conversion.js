function details() {
  return {
    id: "Tdarr_Plugin_ZD93_zacharyd3_hvec_conversion",
	Stage: "Pre-processing",
    Name: "zacharyd3 & Migz -Transcode to HVEC",
    Type: "Video",
    Operation:"Transcode",
    Description: `[Experimental] Made to transcode all files into HVEC using NVIDIA GPUs. Just set the container and the max queue length and you're ready to go. \n\n`,
    Version: "2.20",
    Link: "",
    Tags:'pre-processing,ffmpeg,video only,nvenc h265,configurable',
	Inputs: [
     {
       name: 'container',
       tooltip: `Specify output container of file, ensure that all stream types you may have are supported by your chosen container. mkv is recommended.
	   \\nExample:\\n
	   mkv
	   
	   \\nExample:\\n
	   mp4`
     }, 
	 {
       name: 'queue',
       tooltip: `Specify the maximum queue size to prevent out of packet errors.
	   \\nExample:\\n
	   1024
	   
	   \\nExample:\\n
	   4096* Default
	   
	   \\nExample:\\n
	   9999* Prevents errors`
     }, 
	 {
       name: 'subtitles',
       tooltip: `Keep or remove subtitles.
	   \\nExample:\\n
	   True
	   
	   \\nExample:\\n
	   False`
     }, 
	 {
       name: 'quality',
       tooltip: `Specify quality of the encoding. 0 - 100, the lower the quality, the more space savings you'll see (at 100% quality you'll still get around half the original file size).
	   \\nExample:\\n
	   0* Minimum.
	   
	   \\nExample:\\n
	   100* Default (there is no point in going any higher than 100%).
	   
	   \\nExample:\\n
	   200* No reduction in bitrate, much higher file sizes with no quality gains (it's pointless to do this).`
     }, 
	 ]
  }
}
   
function plugin(file, librarySettings, inputs) {
   var response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: ''
  }

  if (inputs.container == "") {
	  response.infoLog += "\n"
      response.infoLog += "☒ Container has not been configured within plugin settings, please configure required options. Skipping this plugin. \n"
	  response.infoLog += "\n"
      response.processFile = false
      return response
    } else {
	  response.container = '.' + inputs.container
	}

  if (inputs.queue == "") {
	  response.infoLog += "\n"
      response.infoLog += "☒ Queue length has not been configured within plugin settings, please configure required options. Skipping this plugin. \n"
	  response.infoLog += "\n"
      response.processFile = false
      return response
    } else {
	  response.queue = '.' + inputs.queue
	}

  if (inputs.quality == "") {
	  response.infoLog += "\n"
      response.infoLog += "☒ Quality has not been configured within plugin settings, please configure required options. Skipping this plugin. \n"
	  response.infoLog += "\n"
      response.processFile = false
      return response
    } else {
	  response.queue = '.' + inputs.queue
	}
   
  if (file.fileMedium !== "video") {
      response.processFile = false
	  response.infoLog += "\n"
      response.infoLog += "☒ File is not a video. \n"
	  response.infoLog += "\n"
      return response
    }

  if (typeof file.meta.Duration != 'undefined') {
	  var duration = (file.meta.Duration * 0.0166667)
  } else {
	  var duration = (file.ffProbeData.streams[0].duration * 0.0166667)
  }

  var qualitySetting = ~~(200 / inputs.quality)
  var bitrateSettings = ""
  var filesize = (file.file_size / 1000)
  var targetBitrate = ~~((file.file_size / (duration * 0.0075)) / qualitySetting)
  var minimumBitrate = ~~(targetBitrate * 0.7)
  var maximumBitrate = ~~(targetBitrate * 1.3)
    
  if (targetBitrate == "0") {
	  response.processFile = false
	  response.infoLog += "\n"
      response.infoLog += "☒ Target bitrate could not be calculated. Skipping this plugin. \n"
	  response.infoLog += "\n"
      return response
  }

  if (file.ffProbeData.streams[0].codec_name == 'hevc' && file.container == inputs.container) {
      response.processFile = false
	  response.infoLog += "\n"
      response.infoLog += `☑ File is already in ${inputs.container} & hevc. \n`
	  response.infoLog += "\n"
      return response
    }
  
  if (file.ffProbeData.streams[0].codec_name == 'hevc' && file.container != '${inputs.container}') {
	  response.infoLog += "\n"
      response.infoLog += `☒ File is hevc but is not in ${inputs.container} container. Remuxing. \n`
	  response.infoLog += "\n"
      response.preset = ', -map 0 -c copy'
      response.processFile = true;
      return response
    }
	
  bitrateSettings = `-b:v ${targetBitrate}k -minrate ${minimumBitrate}k -maxrate ${maximumBitrate}k`
  response.infoLog += "\n"
  response.infoLog += `Container for output selected as ${inputs.container}. \n Current bitrate = ${~~(file.file_size / (duration * 0.0075))} \n Bitrate settings: \nTarget = ${targetBitrate} \nMinimum = ${minimumBitrate} \nMaximum = ${maximumBitrate} \n`
  response.infoLog += "\n"
 
//codec will be checked so it can be transcoded correctly
  if (file.video_codec_name == 'h263') {
      response.preset = `-c:v h263_cuvid`
    }
  else if (file.video_codec_name == 'h264') {
    if (file.ffProbeData.streams[0].profile != 'High 10') { //if a h264 coded video is not HDR
      response.preset = `-c:v h264_cuvid`
    }
  }
  else if (file.video_codec_name == 'mjpeg') {
    response.preset = `c:v mjpeg_cuvid`
  }
  else if (file.video_codec_name == 'mpeg1') {
    response.preset = `-c:v mpeg1_cuvid`
  }
  else if (file.video_codec_name == 'mpeg2') {
    response.preset = `-c:v mpeg2_cuvid`
  }
  else if (file.video_codec_name == 'vc1') {
    response.preset = `-c:v vc1_cuvid`
  }
  else if (file.video_codec_name == 'vp8') {
    response.preset = `-c:v vp8_cuvid`
  }
  else if (file.video_codec_name == 'vp9') {
    response.preset = `-c:v vp9_cuvid`
  }
  
  if (inputs.container == "mkv") {
	  extraArguments = "-map -0:d "
  }
  
  if (inputs.queue !== "") {
	  queueArguments = `-max_muxing_queue_size ${inputs.queue}`
  }
  
  if (inputs.subtitles == "True") {
	  subtitleArguments = `-c:s copy`
  }
   
  response.preset += `,-map 0 -c:v hevc_nvenc -rc:v vbr_hq ${bitrateSettings} -bufsize 2M -spatial_aq:v 1 -c:a copy ${subtitleArguments} ${queueArguments} ${extraArguments}`
  response.processFile = true
  response.infoLog += "\n"
  response.infoLog += `☒ File is not hevc. Transcoding. \n`
  response.infoLog += "\n"
  return response
}
   
module.exports.details = details;
module.exports.plugin = plugin;
