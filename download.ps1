$urls = @{
    "2a35e886613f474ba4ead8ac796fb1ce" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NmFiZDQ5MzE0ZDkwMzMyZjZjOTgyMmU3OTMyEgsSBxDAp8WUzwMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MzQ4MjI1ODU3NjI0NTczODU0&filename=&opi=89354086"
    "50c60cfe6ec74171b073caa76e9dd2f3" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NmFiZTcwZDljZmYwMWE2MzI5MWM3MDkzZjFkEgsSBxDAp8WUzwMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MzQ4MjI1ODU3NjI0NTczODU0&filename=&opi=89354086"
    "2bc85aaa33c144278884562ba8a5cdce" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NmFjM2QyZTJjYmEwODlhZjZmNjA2MTI4NWM4EgsSBxDAp8WUzwMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MzQ4MjI1ODU3NjI0NTczODU0&filename=&opi=89354086"
    "52f837b2122b4efd9a36f8ab6ea7013f" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NmFjM2Q0MmJhMGMwMzMyZjZjOTgyMmU3OTMyEgsSBxDAp8WUzwMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MzQ4MjI1ODU3NjI0NTczODU0&filename=&opi=89354086"
    "29ff3eb1e24448c09e12a2642ce2035d" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NmFiZTdiMDU0ZTIwMmQzZmRmMDRhMjlhMzM3EgsSBxDAp8WUzwMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MzQ4MjI1ODU3NjI0NTczODU0&filename=&opi=89354086"
    "feffe46188af46a583eb3b87820dcccd" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NmFjM2M2MGQzYjEwOTI1YzA3NTBmMzI5NzcxEgsSBxDAp8WUzwMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MzQ4MjI1ODU3NjI0NTczODU0&filename=&opi=89354086"
    "00da6e03c8de4714b1e1b04ed3bc8b6f" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NmFiZTdiN2I3OTgwMzgzOGU0MWIzMzVhNmU2EgsSBxDAp8WUzwMYAZIBIwoKcHJvamVjdF9pZBIVQhM2MzQ4MjI1ODU3NjI0NTczODU0&filename=&opi=89354086"
}

foreach ($id in $urls.Keys) {
    $url = $urls[$id]
    $outfile = "screens\$id.html"
    Invoke-WebRequest -Uri $url -OutFile $outfile
    Write-Host "Downloaded $id"
}
